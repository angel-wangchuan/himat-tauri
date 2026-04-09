/**
 * 离线图标加载器
 *
 * 使用方式：
 * 1. 安装所需图标集：vp i -D @iconify-json/[icon-set-name]
 * 2. 在此文件中导入并注册图标集
 * 3. 在组件中使用：<SvgIcon icon="ri:home-line" />
 *
 * @module utils/ui/iconify-loader
 * @author Art Design Pro Team
 */

import { addCollection } from "@iconify/vue";

// 导入离线图标数据

// 系统必要图标库
import riIcons from "@iconify-json/ri/icons.json";

// 注册离线图标集
addCollection(riIcons);
