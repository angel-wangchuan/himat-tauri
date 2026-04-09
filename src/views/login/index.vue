<script setup lang="ts">
import BackgroundDark from "@imgs/login/background-dark.png";
import BackgroundLight from "@imgs/login/background-light.png";

import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { storeToRefs } from "pinia";
import { computed } from "vue";
import * as z from "zod";

import { useTauri } from "@/composables/useTauri";
import { useColorMode } from "@vueuse/core";
import { useUserStore } from "@stores/user";
import { useI18n } from "vue-i18n";
import api, { setRequestBaseURL } from "@/utils/request";

const router = useRouter();
const { isTauri, openUrl } = useTauri();
const mode = useColorMode({ disableTransition: false });
const { t } = useI18n();

const userStore = useUserStore();
const { setIsLogin, setServerUrl, setLastLoginMethod } = userStore;
const { lastLoginMethod, serverList } = storeToRefs(userStore);

const defaultServerUrl = userStore.serverUrl || serverList.value[0] || "";
const isOauthMode = computed(() => lastLoginMethod.value === "oauth");

const isLoading = ref(false);

// 登录模式下服务器地址的共享验证。
const serverUrlSchema = z
  .string({ required_error: t("login.validation.server_url_required") })
  .trim()
  .min(1, t("login.validation.server_url_required"))
  .url(t("login.validation.server_url_invalid"));

// 密码登录模式下用户名和密码的验证。
const usernameSchema = z
  .string({ required_error: t("login.validation.username_required") })
  .trim()
  .min(2, t("login.validation.username_min"))
  .max(50, t("login.validation.username_max"));

const passwordSchema = z
  .string({ required_error: t("login.validation.password_required") })
  .trim()
  .min(2, t("login.validation.password_min"))
  .max(50, t("login.validation.password_max"));

const validationSchema = toTypedSchema(
  z
    .object({
      serverUrl: serverUrlSchema,
      username: z.string().optional(),
      password: z.string().optional(),
    })
    .superRefine((values, ctx) => {
      // OAuth模式只需要服务器地址。
      if (isOauthMode.value) {
        return;
      }

      const usernameResult = usernameSchema.safeParse(values.username);
      const passwordResult = passwordSchema.safeParse(values.password);

      if (!usernameResult.success) {
        usernameResult.error.issues.forEach((issue) => {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: issue.message,
            path: ["username"],
          });
        });
      }

      if (!passwordResult.success) {
        passwordResult.error.issues.forEach((issue) => {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: issue.message,
            path: ["password"],
          });
        });
      }
    }),
);

const form = useForm({
  validationSchema,
  initialValues: {
    serverUrl: defaultServerUrl,
    username: "",
    password: "",
  },
});

const [serverUrl, serverUrlProps] = form.defineField("serverUrl");
const [username, usernameProps] = form.defineField("username");
const [password, passwordProps] = form.defineField("password");

const switchLoginMethod = () => {
  const nextMethod = isOauthMode.value ? "password" : "oauth";
  setLastLoginMethod(nextMethod);

  if (nextMethod === "oauth") {
    form.setFieldError("username", undefined);
    form.setFieldError("password", undefined);
  }
};

const handleSelectServer = (item: string) => {
  serverUrl.value = item;
  form.setFieldValue("serverUrl", item);
};

const submitOauth = async () => {
  // 提交OAuth登录前验证可见字段。
  const { valid } = await form.validate();
  if (!valid) {
    return;
  }

  isLoading.value = true;

  try {
    setServerUrl(serverUrl.value);
    setRequestBaseURL(serverUrl.value);
    const oauthUrl = new URL("/auth/casdoor?client=desktop", serverUrl.value).toString();

    if (isTauri.value) {
      await openUrl(oauthUrl);
      return;
    }

    window.open(oauthUrl, "_blank", "noopener,noreferrer");
  } catch (error) {
    const oauthUrl = new URL("/auth/casdoor?client=desktop", serverUrl.value).toString();
    if (isTauri.value) {
      console.error("[login] Failed to open external browser", error);
    }
    window.open(oauthUrl, "_blank", "noopener,noreferrer");
  } finally {
    isLoading.value = false;
  }
};

// 提交密码登录前验证可见字段。
const submitPassword = form.handleSubmit(async (values) => {
  isLoading.value = true;
  try {
    setServerUrl(values.serverUrl);
    setRequestBaseURL(values.serverUrl);
    console.log("Password 登陆", values);

    const { data } = await api.authLogin({
      authLoginRequest: {
        username: values.username,
        password: values.password,
      },
    });

    console.log("Password 登陆响应", data);

    setIsLogin(true);
    userStore.setAccessToken(data.access_token || "");
    userStore.setRefreshToken(data.refresh_token || "");
    userStore.setUser(data.user || {});

    await router.push({ name: "Home" });
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div>
    <Field class="fixed top-0 left-0 z-10 h-10 w-full" data-tauri-drag-region />

    <Card class="min-h-dvh overflow-hidden rounded-none border-0 p-0">
      <CardContent class="grid min-h-dvh p-0 md:grid-cols-2">
        <div class="bg-muted relative hidden min-h-dvh md:block">
          <img
            :src="mode === 'dark' ? BackgroundDark : BackgroundLight"
            alt="Image"
            class="pointer-events-none absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          />
        </div>

        <form class="flex min-h-dvh items-center p-6 md:p-8" @submit.prevent>
          <FieldGroup class="w-full">
            <div class="pointer-events-none flex flex-col items-center gap-2 text-center">
              <h1 class="text-2xl font-bold">{{ $t("app.name") }}</h1>
              <p class="text-muted-foreground text-balance">{{ $t("app.description") }}</p>
            </div>

            <Field :data-invalid="!!form.errors.value.serverUrl">
              <FieldLabel for="serverUrl">{{ $t("login.server_url") }}</FieldLabel>
              <Field class="w-full" orientation="horizontal">
                <Input
                  id="serverUrl"
                  v-model="serverUrl"
                  type="text"
                  :placeholder="$t('login.placeholder.server_url')"
                  v-bind="serverUrlProps"
                  :aria-invalid="!!form.errors.value.serverUrl"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button type="button" variant="outline" size="icon">
                      <SvgIcon icon="ri:arrow-down-s-line" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="left">
                    <DropdownMenuItem
                      v-for="item in serverList"
                      :key="item"
                      @click="handleSelectServer(item)"
                    >
                      {{ item }}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Field>
              <!-- <FieldError :errors="form.errors.value.serverUrl ? [form.errors.value.serverUrl] : []" /> -->
            </Field>

            <Field v-if="!isOauthMode" :data-invalid="!!form.errors.value.username">
              <FieldLabel for="username">{{ $t("login.username") }}</FieldLabel>

              <Input
                id="username"
                v-model="username"
                type="text"
                :placeholder="$t('login.placeholder.username')"
                v-bind="usernameProps"
                :aria-invalid="!!form.errors.value.username"
              />
              <!-- <FieldError :errors="form.errors.value.username ? [form.errors.value.username] : []" /> -->
            </Field>

            <Field v-if="!isOauthMode" :data-invalid="!!form.errors.value.password">
              <FieldLabel for="password">{{ $t("login.password") }}</FieldLabel>
              <Input
                id="password"
                v-model="password"
                type="password"
                :placeholder="$t('login.placeholder.password')"
                v-bind="passwordProps"
                :aria-invalid="!!form.errors.value.password"
              />
              <!-- <FieldError :errors="form.errors.value.password ? [form.errors.value.password] : []" /> -->
            </Field>

            <Field>
              <Button
                type="button"
                class="w-full"
                :disabled="isLoading"
                @click="isOauthMode ? submitOauth() : submitPassword()"
              >
                <Spinner v-if="isLoading" />
                {{ isOauthMode ? $t("login.button.oauth") : $t("login.button.login") }}
              </Button>
            </Field>

            <FieldSeparator class="*:data-[slot=field-separator-content]:bg-card">
              {{ $t("login.switch.with") }}
            </FieldSeparator>

            <Field class="grid grid-cols-1 gap-4">
              <Button variant="outline" type="button" @click="switchLoginMethod">
                {{ isOauthMode ? $t("login.switch.login") : $t("login.switch.oauth") }}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
