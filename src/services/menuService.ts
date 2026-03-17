import type { Menu, CreateMenuData, UpdateMenuData } from "@/types/menus/menu";
import { createBaseService } from "./baseService";

export const menuService = createBaseService<Menu, CreateMenuData, UpdateMenuData>("menus");
