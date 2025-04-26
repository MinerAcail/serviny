import {  Home, Inbox, ShoppingBag } from "lucide-react"
import Request from  "../../icons/request-new.tsx"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { gql, useMutation } from "@apollo/client"
import { useEffect } from "react"

// Menu items.
const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Combo",
    url: "/shop",
    icon: ShoppingBag,
  },
  {
    title: "Job Posting",
    url: "/job",
    icon: Inbox,
  },
  {
    title: "Item Request",
    url: "/request",
    icon: Request,

  },

]

export const ClearLocalStore = gql`
mutation ClearLocalStore($orderId: String){
  clearLocalStore(orderId:$orderId)
}
`

export function AppSidebar() {
  const rawOrderId = localStorage.getItem("foodie_last_order_id");
  const orderId = rawOrderId ? rawOrderId.replace(/^"|"$/g, "").trim() : null;
  const sanitizedOrderId = orderId && orderId.length > 0 ? orderId : null;

  const [clearLocalStore, { data }] = useMutation(ClearLocalStore);

  useEffect(() => {
    if (!sanitizedOrderId) return;

    clearLocalStore({
      variables: { orderId: sanitizedOrderId },
    });
  }, [sanitizedOrderId, clearLocalStore]);

  useEffect(() => {
    if (data?.clearLocalStore) {
      localStorage.removeItem("foodie_last_order_id");
    }
  }, [data]);

  return (
    <Sidebar className={""}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={"font-bold"}>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className={" "}>
              {items.map((item) => (
                <SidebarMenuItem key={item.title} className={"text-4xl font-bold"}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
