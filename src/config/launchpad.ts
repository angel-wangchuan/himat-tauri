import { i18n } from "@/i18n";

import agentIcon from "@imgs/launchpad/agent.png";
import appsIcon from "@imgs/launchpad/apps.png";
import chatIcon from "@imgs/launchpad/chat.png";
import codeIcon from "@imgs/launchpad/code.png";
import filesIcon from "@imgs/launchpad/files.png";
import knowledgeIcon from "@imgs/launchpad/knowledge.png";
import notesIcon from "@imgs/launchpad/notes.png";
// import openclawIcon from "@imgs/launchpad/openclaw.png";
import painting from "@imgs/launchpad/painting.png";
import storeIcon from "@imgs/launchpad/store.png";
import translateIcon from "@imgs/launchpad/translate.png";
import workflowIcon from "@imgs/launchpad/workflow.png";

export function getAppMenu() {
  const t = i18n.global.t;
  return [
    {
      name: t("chat.name"),
      description: t("chat.description"),
      icon: chatIcon,
      path: "/chat",
    },
    {
      name: t("agent.name"),
      description: t("agent.description"),
      icon: agentIcon,
      path: "/agent",
    },
    {
      name: t("miniapp.name"),
      description: t("miniapp.description"),
      icon: appsIcon,
      path: "/apps",
    },
    {
      name: t("knowledge.name"),
      description: t("knowledge.description"),
      icon: knowledgeIcon,
      path: "/knowledge",
    },
    {
      name: t("store.name"),
      description: t("store.description"),
      icon: storeIcon,
      path: "/chatStore",
    },
    {
      name: t("files.name"),
      description: t("files.description"),
      icon: filesIcon,
      path: "/files",
    },
    {
      name: t("notes.name"),
      description: t("notes.description"),
      icon: notesIcon,
      path: "/notes",
    },
    {
      name: t("drawing.name"),
      description: t("drawing.description"),
      icon: painting,
      path: "/drawing",
    },
    {
      name: t("translate.name"),
      description: t("translate.description"),
      icon: translateIcon,
      path: "/translate",
    },
    {
      name: t("code.name"),
      description: t("code.description"),
      icon: codeIcon,
      path: "/code",
    },
    {
      name: t("workflow.name"),
      description: t("workflow.description"),
      icon: workflowIcon,
      path: "/workflow",
    },
    // {
    //   name: t("openclaw.name"),
    //   description: t("openclaw.description"),
    //   icon: openclawIcon,
    //   path: "/openclaw",
    // },
  ];
}
