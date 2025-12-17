import { useAuthContext } from "../../context/auth-context";
import {
  Avatar,
  Label,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Divider,
  Tooltip,
} from "@fluentui/react-components";
import "./Account.css";

export function Account() {
  const { authService } = useAuthContext();

  const signOut = async () => {
    try {
      await authService.signout();
      window.location.reload(); // Refresh to update auth state
    } catch (error) {
      console.error("Signout error:", error);
    }
  };

  return (
    <div className="account">
      <Menu positioning={{ autoSize: true }}>
        <MenuTrigger disableButtonEnhancement>
          <Tooltip content="Account" relationship="description">
            <Avatar name={authService.account?.name || authService.account?.username}></Avatar>
          </Tooltip>
        </MenuTrigger>

        <MenuPopover>
          <div className="account-info">
            <Avatar name={authService.account?.name || authService.account?.username}></Avatar>
            <div className="string-info">
              <span className="lastAndFirst">{authService.account?.name}</span>
              <Label>{authService.account?.username}</Label>
            </div>
          </div>
          <Divider />
          <MenuList>
            <MenuItem onClick={signOut}>Sign out</MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
    </div>
  );
}
