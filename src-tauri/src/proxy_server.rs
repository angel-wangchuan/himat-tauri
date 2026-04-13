use http_body_util::{BodyExt, Full};
use hyper::body::{Bytes, Incoming};
use hyper::header::HOST;
use hyper::server::conn::http1;
use hyper::service::service_fn;
use hyper::upgrade::Upgraded;
use hyper::{Method, Request, Response, StatusCode, Uri};
use hyper_util::rt::TokioIo;
use reqwest::header::HeaderMap;
use std::fmt;
use std::net::SocketAddr;
use std::str::FromStr;
use std::sync::Arc;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::RwLock;
use url::Url;

#[derive(Debug, Clone, Default)]
pub struct ProxyConfig {
    pub upstream: Option<String>,
}

pub type SharedProxy = Arc<RwLock<ProxyConfig>>;

#[derive(Debug, Clone)]
pub enum ProxyMode {
    Direct,
    Upstream,
}

#[derive(Debug, Clone)]
enum UpstreamProxy {
    Http { host: String, port: u16 },
    Socks5 { host: String, port: u16 },
}

#[derive(Debug)]
struct ProxyError(String);

impl ProxyError {
    fn new(message: impl Into<String>) -> Self {
        Self(message.into())
    }
}

impl fmt::Display for ProxyError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.0)
    }
}

impl std::error::Error for ProxyError {}

pub async fn start_local_proxy(
    config: SharedProxy,
) -> Result<SocketAddr, Box<dyn std::error::Error + Send + Sync>> {
    let listener = TcpListener::bind("127.0.0.1:0").await?;
    let addr = listener.local_addr()?;

    tokio::spawn(async move {
        loop {
            let (stream, _) = match listener.accept().await {
                Ok(pair) => pair,
                Err(error) => {
                    eprintln!("Proxy accept error: {error}");
                    continue;
                }
            };

            let config = Arc::clone(&config);
            tokio::spawn(async move {
                let io = TokioIo::new(stream);
                let service = service_fn(move |request| {
                    let config = Arc::clone(&config);
                    async move { handle_request(request, config).await }
                });

                if let Err(error) = http1::Builder::new()
                    .serve_connection(io, service)
                    .with_upgrades()
                    .await
                {
                    eprintln!("Proxy connection error: {error}");
                }
            });
        }
    });

    Ok(addr)
}

pub async fn get_proxy_mode(config: &SharedProxy) -> ProxyMode {
    let upstream = config.read().await.upstream.clone();
    match upstream {
        Some(_) => ProxyMode::Upstream,
        None => ProxyMode::Direct,
    }
}

async fn handle_request(
    request: Request<Incoming>,
    config: SharedProxy,
) -> Result<Response<Full<Bytes>>, hyper::Error> {
    let current_config = config.read().await.clone();

    if request.method() == Method::CONNECT {
        handle_connect(request, current_config).await
    } else {
        handle_http(request, current_config).await
    }
}

async fn handle_http(
    request: Request<Incoming>,
    config: ProxyConfig,
) -> Result<Response<Full<Bytes>>, hyper::Error> {
    let target_url = match resolve_target_url(&request) {
        Ok(url) => url,
        Err(error) => return Ok(error_response(StatusCode::BAD_REQUEST, error.to_string())),
    };
    let target_url_text = target_url.to_string();

    let client = match build_http_client(&config) {
        Ok(client) => client,
        Err(error) => return Ok(error_response(StatusCode::BAD_GATEWAY, error.to_string())),
    };

    let mut builder = client.request(request.method().clone(), target_url);
    for (name, value) in request.headers() {
        if should_skip_request_header(name.as_str()) {
            continue;
        }
        builder = builder.header(name, value);
    }

    let body = request.collect().await?.to_bytes();
    let response = match builder.body(body.to_vec()).send().await {
        Ok(response) => response,
        Err(error) => {
            eprintln!("Proxy request failed for {target_url_text}: {error}");
            return Ok(error_response(
                StatusCode::BAD_GATEWAY,
                format!("Proxy request failed: {error}"),
            ));
        }
    };

    let status = response.status();
    let headers = response.headers().clone();
    let bytes = match response.bytes().await {
        Ok(bytes) => bytes,
        Err(error) => {
            return Ok(error_response(
                StatusCode::BAD_GATEWAY,
                format!("Proxy response read failed: {error}"),
            ));
        }
    };

    let mut proxied = Response::new(Full::new(Bytes::from(bytes.to_vec())));
    *proxied.status_mut() =
        StatusCode::from_u16(status.as_u16()).unwrap_or(StatusCode::BAD_GATEWAY);
    copy_response_headers(proxied.headers_mut(), &headers);
    Ok(proxied)
}

async fn handle_connect(
    request: Request<Incoming>,
    config: ProxyConfig,
) -> Result<Response<Full<Bytes>>, hyper::Error> {
    let authority = match request.uri().authority() {
        Some(authority) => authority.to_string(),
        None => {
            return Ok(error_response(
                StatusCode::BAD_REQUEST,
                "CONNECT request missing authority",
            ))
        }
    };

    tokio::spawn(async move {
        let result = async {
            let upgraded = hyper::upgrade::on(request).await?;
            let mut client_stream = TokioIo::new(upgraded);

            if let Some(upstream) = parse_upstream_proxy(config.upstream.as_deref())? {
                tunnel_via_upstream(&mut client_stream, &authority, upstream).await?;
            } else {
                tunnel_direct(&mut client_stream, &authority).await?;
            }

            Ok::<(), Box<dyn std::error::Error + Send + Sync>>(())
        }
        .await;

        match result {
            Ok(()) => {}
            Err(error) => eprintln!("CONNECT proxy error for {authority}: {error}"),
        }
    });

    Ok(Response::builder()
        .status(StatusCode::OK)
        .body(Full::new(Bytes::new()))
        .unwrap())
}

fn resolve_target_url(
    request: &Request<Incoming>,
) -> Result<Url, Box<dyn std::error::Error + Send + Sync>> {
    if let Ok(url) = Url::parse(&request.uri().to_string()) {
        return Ok(url);
    }

    let host = request
        .headers()
        .get(HOST)
        .ok_or_else(|| ProxyError::new("Missing Host header"))?
        .to_str()?;

    let path = request
        .uri()
        .path_and_query()
        .map(|value| value.as_str())
        .unwrap_or("/");

    Url::parse(&format!("http://{host}{path}")).map_err(|error| error.into())
}

fn should_skip_request_header(name: &str) -> bool {
    matches!(
        name.to_ascii_lowercase().as_str(),
        "host" | "connection" | "proxy-connection" | "proxy-authorization"
    )
}

fn copy_response_headers(target: &mut HeaderMap, source: &HeaderMap) {
    for (name, value) in source {
        if matches!(
            name.as_str().to_ascii_lowercase().as_str(),
            "connection" | "proxy-connection" | "transfer-encoding"
        ) {
            continue;
        }

        target.insert(name, value.clone());
    }
}

fn error_response(status: StatusCode, message: impl Into<String>) -> Response<Full<Bytes>> {
    Response::builder()
        .status(status)
        .body(Full::new(Bytes::from(message.into())))
        .unwrap()
}

fn build_http_client(
    config: &ProxyConfig,
) -> Result<reqwest::Client, Box<dyn std::error::Error + Send + Sync>> {
    let mut builder = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::limited(10))
        .no_proxy();

    if let Some(upstream) = config.upstream.as_deref() {
        builder = builder.proxy(reqwest::Proxy::all(upstream)?);
    }

    builder.build().map_err(|error| error.into())
}

fn parse_upstream_proxy(
    upstream: Option<&str>,
) -> Result<Option<UpstreamProxy>, Box<dyn std::error::Error + Send + Sync>> {
    let Some(upstream) = upstream else {
        return Ok(None);
    };

    let url = Url::parse(upstream)?;
    let host = url
        .host_str()
        .ok_or_else(|| ProxyError::new("Proxy host is missing"))?
        .to_string();
    let port = url
        .port_or_known_default()
        .ok_or_else(|| ProxyError::new("Proxy port is missing"))?;

    match url.scheme() {
        "http" => Ok(Some(UpstreamProxy::Http { host, port })),
        "socks5" => Ok(Some(UpstreamProxy::Socks5 { host, port })),
        scheme => Err(ProxyError::new(format!("Unsupported proxy scheme: {scheme}")).into()),
    }
}

async fn tunnel_direct(
    client_stream: &mut TokioIo<Upgraded>,
    authority: &str,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let mut target_stream = TcpStream::connect(authority).await?;
    tokio::io::copy_bidirectional(client_stream, &mut target_stream).await?;
    Ok(())
}

async fn tunnel_via_upstream(
    client_stream: &mut TokioIo<Upgraded>,
    authority: &str,
    upstream: UpstreamProxy,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    match upstream {
        UpstreamProxy::Http { host, port } => {
            let mut upstream_stream = TcpStream::connect((host.as_str(), port)).await?;
            let connect_request = format!(
                "CONNECT {authority} HTTP/1.1\r\nHost: {authority}\r\nConnection: keep-alive\r\n\r\n"
            );
            upstream_stream
                .write_all(connect_request.as_bytes())
                .await?;

            let mut response = Vec::with_capacity(1024);
            let mut chunk = [0u8; 256];
            loop {
                let read = upstream_stream.read(&mut chunk).await?;
                if read == 0 {
                    return Err(ProxyError::new("Upstream proxy closed CONNECT response").into());
                }

                response.extend_from_slice(&chunk[..read]);
                if response.windows(4).any(|window| window == b"\r\n\r\n") {
                    break;
                }

                if response.len() > 8192 {
                    return Err(ProxyError::new("Upstream CONNECT response too large").into());
                }
            }

            let response_text = String::from_utf8_lossy(&response);
            if !response_text.starts_with("HTTP/1.1 200")
                && !response_text.starts_with("HTTP/1.0 200")
            {
                return Err(
                    ProxyError::new(format!("Upstream CONNECT failed: {response_text}")).into(),
                );
            }

            tokio::io::copy_bidirectional(client_stream, &mut upstream_stream).await?;
            Ok(())
        }
        UpstreamProxy::Socks5 { host, port } => {
            let mut upstream_stream = TcpStream::connect((host.as_str(), port)).await?;
            socks5_connect(&mut upstream_stream, authority).await?;
            tokio::io::copy_bidirectional(client_stream, &mut upstream_stream).await?;
            Ok(())
        }
    }
}

async fn socks5_connect(
    stream: &mut TcpStream,
    authority: &str,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let (host, port) = split_authority(authority)?;

    stream.write_all(&[0x05, 0x01, 0x00]).await?;
    let mut greeting_response = [0u8; 2];
    stream.read_exact(&mut greeting_response).await?;
    if greeting_response != [0x05, 0x00] {
        return Err(ProxyError::new("SOCKS5 greeting failed").into());
    }

    let host_bytes = host.as_bytes();
    if host_bytes.len() > u8::MAX as usize {
        return Err(ProxyError::new("SOCKS5 host is too long").into());
    }

    let mut request = vec![0x05, 0x01, 0x00, 0x03, host_bytes.len() as u8];
    request.extend_from_slice(host_bytes);
    request.extend_from_slice(&port.to_be_bytes());
    stream.write_all(&request).await?;

    let mut response_head = [0u8; 4];
    stream.read_exact(&mut response_head).await?;
    if response_head[1] != 0x00 {
        return Err(ProxyError::new(format!(
            "SOCKS5 connect failed with code {}",
            response_head[1]
        ))
        .into());
    }

    let address_length = match response_head[3] {
        0x01 => 4,
        0x03 => {
            let mut len = [0u8; 1];
            stream.read_exact(&mut len).await?;
            len[0] as usize
        }
        0x04 => 16,
        atyp => return Err(ProxyError::new(format!("Unsupported SOCKS5 ATYP: {atyp}")).into()),
    };

    let mut discard = vec![0u8; address_length + 2];
    stream.read_exact(&mut discard).await?;
    Ok(())
}

fn split_authority(
    authority: &str,
) -> Result<(String, u16), Box<dyn std::error::Error + Send + Sync>> {
    let uri = Uri::from_str(&format!("http://{authority}"))?;
    let host = uri
        .host()
        .ok_or_else(|| ProxyError::new("Authority host is missing"))?
        .to_string();
    let port = uri
        .port_u16()
        .ok_or_else(|| ProxyError::new("Authority port is missing"))?;
    Ok((host, port))
}
