import { i18n } from "@/i18n";

const t = i18n.global.t;

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
  return [
    {
      name: t("menu.chat.name"),
      description: t("menu.chat.description"),
      icon: chatIcon,
      path: "/chat",
    },
    {
      name: t("menu.agent.name"),
      description: t("menu.agent.description"),
      icon: agentIcon,
      path: "/agent",
    },
    {
      name: t("menu.apps.name"),
      description: t("menu.apps.description"),
      icon: appsIcon,
      path: "/apps",
    },
    {
      name: t("menu.knowledge.name"),
      description: t("menu.knowledge.description"),
      icon: knowledgeIcon,
      path: "/knowledge",
    },
    {
      name: t("menu.store.name"),
      description: t("menu.store.description"),
      icon: storeIcon,
      path: "/chatStore",
    },
    {
      name: t("menu.files.name"),
      description: t("menu.files.description"),
      icon: filesIcon,
      path: "/files",
    },
    {
      name: t("menu.notes.name"),
      description: t("menu.notes.description"),
      icon: notesIcon,
      path: "/notes",
    },
    {
      name: t("menu.drawing.name"),
      description: t("menu.drawing.description"),
      icon: painting,
      path: "/drawing",
    },
    {
      name: t("menu.translate.name"),
      description: t("menu.translate.description"),
      icon: translateIcon,
      path: "/translate",
    },
    {
      name: t("menu.code.name"),
      description: t("menu.code.description"),
      icon: codeIcon,
      path: "/code",
    },
    {
      name: t("menu.workflow.name"),
      description: t("menu.workflow.description"),
      icon: workflowIcon,
      path: "/workflow",
    },
    // {
    //   name: t("menu.openclaw.name"),
    //   description: t("menu.openclaw.description"),
    //   icon: openclawIcon,
    //   path: "/openclaw",
    // },
  ];
}
