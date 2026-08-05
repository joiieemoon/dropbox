import * as React from "react";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import Link, { LinkProps } from "@mui/material/Link";
import { ListItemProps } from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import Collapse from "@mui/material/Collapse";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import { Link as RouterLink, useLocation } from "react-router-dom";

// 1. Un-commented and defined the breadcrumb mapping
const breadcrumbNameMap: { [key: string]: string } = {
  "/inbox": "Inbox",
  "/inbox/important": "Important",
  "/trash": "Trash",
  "/spam": "Spam",
  "/drafts": "Drafts",
};

interface ListItemLinkProps extends ListItemProps {
  to: string;
  open?: boolean;
}

function ListItemLink(props: ListItemLinkProps) {
  const { to, open, ...other } = props;
  const primary = breadcrumbNameMap[to] || to;

  let icon = null;
  if (open != null) {
    icon = open ? <ExpandLess /> : <ExpandMore />;
  }

  return (
    <li>
      <ListItemButton component={RouterLink as any} to={to} {...other}>
        <ListItemText primary={primary} />
        {icon}
      </ListItemButton>
    </li>
  );
}

interface LinkRouterProps extends LinkProps {
  to: string;
  replace?: boolean;
}

function LinkRouter(props: LinkRouterProps) {
  return <Link {...props} component={RouterLink as any} />;
}

// 2. Breadcrumb Page component uses current app location
function BreadcrumbNav() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <Breadcrumbs aria-label="breadcrumb">
      <LinkRouter underline="hover" color="inherit" to="/">
        Home
      </LinkRouter>
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join("/")}`;
        const name = breadcrumbNameMap[to] || value;

        return last ? (
          <Typography key={to} sx={{ color: "text.primary" }}>
            {name}
          </Typography>
        ) : (
          <LinkRouter underline="hover" color="inherit" to={to} key={to}>
            {name}
          </LinkRouter>
        );
      })}
    </Breadcrumbs>
  );
}

// 3. Removed <MemoryRouter> and <Routes> wrapper so it consumes your main app's router context safely
export default function RouterBreadcrumbs() {
  const [open, setOpen] = React.useState(true);

  const handleClick = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", width: 360 }}>
      <BreadcrumbNav />
      <Box
        sx={{ bgcolor: "background.paper", mt: 1 }}
        component="nav"
        aria-label="mailbox folders"
      >
        <List>
          <ListItemLink to="/inbox" open={open} onClick={handleClick} />
          <Collapse component="li" in={open} timeout="auto" unmountOnExit>
            <List disablePadding>
              <ListItemLink sx={{ pl: 4 }} to="/inbox/important" />
            </List>
          </Collapse>
          <ListItemLink to="/trash" />
          <ListItemLink to="/spam" />
        </List>
      </Box>
    </Box>
  );
}
