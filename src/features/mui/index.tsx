import { useState } from "react";
import PageBreadcrumb from "../../components/common/pagebread-crumb/PageBreadCrumb";
import PageMeta from "../../components/common/pagemeta/PageMeta";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  Badge,
  Avatar,
  Chip,
  Stack,
  Box,
  Paper,
  Divider,
  Skeleton,
  Slider,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MailIcon from "@mui/icons-material/Mail";
import NotificationsIcon from "@mui/icons-material/Notifications";
import RouterBreadcrumbs from "./components/accradation";
export default function MuiLibraryKit() {
  /* ── Accordion (Settings/FAQ style) ── */
  const [expanded, setExpanded] = useState<string | false>("panel1");

  const handleAccordionChange =
    (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  /* ── TextField (Form control) ── */
  const [textValue, setTextValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [val, setVal] = useState(30);
  /* ── Dialog (Confirmation popup with state) ── */
  const [dialogOpen, setDialogOpen] = useState(false);

  /* ── Select (Dropdown menu) ── */
  const [age, setAge] = useState("");

  /* ── Switch (Dark mode / feature toggle) ── */
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  /* ── Badge (Notification badge on an Icon) ── */
  const [unreadCount, setUnreadCount] = useState(4);

  /* ── Chip (Filter or status tag) ── */
  const [selectedChips, setSelectedChips] = useState<string[]>(["React"]);

  const handleChipClick = (chip: string) => {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip],
    );
  };

  const handleDeleteChip = (chip: string) => {
    setSelectedChips((prev) => prev.filter((c) => c !== chip));
  };

  return (
    <div>
      <PageMeta
        title="MUI Library Kit | TrackSend"
        description="Interactive MUI components showcase"
      />
      <PageBreadcrumb pageTitle="MUI Library Kit" />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" },
          gap: 6,
        }}
      >
        {/* ── Column 1 ── */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {/* ── 1. Accordion (Settings/FAQ style) ── */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Accordion — Settings / FAQ
            </Typography>
            <Accordion
              expanded={expanded === "panel1"}
              onChange={handleAccordionChange("panel1")}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 500 }}>
                  Account Settings
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  Manage your email, password, and profile preferences. Changes
                  are saved automatically.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion
              expanded={expanded === "panel2"}
              onChange={handleAccordionChange("panel2")}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 500 }}>
                  Notification Preferences
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  Choose which notifications you receive — email, push, or SMS.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion
              expanded={expanded === "panel3"}
              onChange={handleAccordionChange("panel3")}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 500 }}>
                  Privacy & Security
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  Control who can see your profile and review your recent login
                  activity.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Paper>

          {/* ── 2. Button (Primary action states) ── */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Button — Primary Action States
            </Typography>
            <Stack
              direction="row"
              spacing={2}
              useFlexGap
              sx={{ flexWrap: "wrap" }}
            >
              <Button variant="contained">Contained</Button>
              <Button variant="outlined">Outlined</Button>
              <Button variant="text">Text</Button>
              <Button variant="contained" color="secondary">
                Secondary
              </Button>
              <Button variant="contained" color="success">
                Success
              </Button>
              <Button variant="contained" color="error">
                Error
              </Button>
              <Button variant="contained" disabled>
                Disabled
              </Button>
              <Button variant="contained" size="small">
                Small
              </Button>
              <Button variant="contained" size="large">
                Large
              </Button>
            </Stack>
          </Paper>

          {/* ── 3. TextField (Form control) ── */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              TextField — Form Control
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Name"
                variant="outlined"
                size="small"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                helperText={textValue ? `You typed: ${textValue}` : " "}
              />
              <TextField
                label="Email"
                variant="outlined"
                size="small"
                type="email"
                value={emailValue}
                onChange={(e) => setEmailValue(e.target.value)}
                helperText="We'll never share your email"
              />
              <TextField
                label="Multiline"
                variant="outlined"
                size="small"
                multiline
                rows={3}
                placeholder="Enter a longer message…"
              />
              <TextField
                label="Error state"
                variant="outlined"
                size="small"
                error
                defaultValue="Invalid value"
                helperText="This field has an error"
              />
              <TextField
                label="Disabled"
                variant="outlined"
                size="small"
                disabled
                value="Read-only content"
              />
            </Stack>
          </Paper>

          {/* ── 4. Card (Feature card layout) ── */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Card — Feature Card Layout
            </Typography>
            <Card variant="outlined" sx={{ maxWidth: 400 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Analytics Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Real-time insights into your application performance, user
                  engagement, and revenue metrics — all in one place.
                </Typography>
              </CardContent>
              <Divider />
              <CardActions>
                <Button size="small" variant="contained">
                  Open Dashboard
                </Button>
                <Button size="small">Learn More</Button>
              </CardActions>
            </Card>
          </Paper>

          {/* ── 5. Dialog (Confirmation popup with state) ── */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Dialog — Confirmation Popup
            </Typography>
            <Button
              variant="contained"
              color="error"
              onClick={() => setDialogOpen(true)}
            >
              Delete Item
            </Button>
            <Dialog
              open={dialogOpen}
              onClose={() => setDialogOpen(false)}
              aria-labelledby="confirm-dialog-title"
              aria-describedby="confirm-dialog-description"
            >
              <DialogTitle id="confirm-dialog-title">
                Confirm Deletion
              </DialogTitle>
              <DialogContent>
                <DialogContentText id="confirm-dialog-description">
                  Are you sure you want to delete this item? This action cannot
                  be undone.
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button
                  onClick={() => {
                    setDialogOpen(false);
                    alert("Item deleted (demo)");
                  }}
                  color="error"
                  variant="contained"
                  autoFocus
                >
                  Delete
                </Button>
              </DialogActions>
            </Dialog>
          </Paper>
        </Box>

        {/* ── Column 2 ── */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {/* ── 6. Select (Dropdown menu) ── */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Select — Dropdown Menu
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel id="age-select-label">Age</InputLabel>
              <Select
                labelId="age-select-label"
                id="age-select"
                value={age}
                label="Age"
                onChange={(e) => setAge(e.target.value)}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                <MenuItem value={10}>Ten</MenuItem>
                <MenuItem value={20}>Twenty</MenuItem>
                <MenuItem value={30}>Thirty</MenuItem>
              </Select>
            </FormControl>
            {age && (
              <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                Selected: {age}
              </Typography>
            )}
          </Paper>

          {/* ── 7. Switch (Dark mode / feature toggle) ── */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Switch — Feature Toggle
            </Typography>
            <Stack spacing={1}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography>Dark Mode</Typography>
                <Switch
                  checked={darkMode}
                  onChange={(e) => setDarkMode(e.target.checked)}
                />
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography>Push Notifications</Typography>
                <Switch
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                />
              </Box>
            </Stack>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: "block" }}
            >
              Dark mode: {darkMode ? "ON" : "OFF"} &nbsp;|&nbsp; Notifications:{" "}
              {notifications ? "ON" : "OFF"}
            </Typography>
          </Paper>

          {/* ── 8. Badge (Notification badge on an Icon) ── */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Badge — Notification Badge
            </Typography>
            <Stack direction="row" spacing={4} sx={{ alignItems: "center" }}>
              <Badge badgeContent={unreadCount} color="primary">
                <MailIcon color="action" />
              </Badge>
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon color="action" />
              </Badge>
              <Badge badgeContent={0} color="primary" showZero>
                <MailIcon color="action" />
              </Badge>
              <Badge variant="dot" color="error" invisible={!notifications}>
                <NotificationsIcon color="action" />
              </Badge>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setUnreadCount((c) => c + 1)}
              >
                + Add
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setUnreadCount((c) => Math.max(0, c - 1))}
              >
                - Remove
              </Button>
              <Button size="small" onClick={() => setUnreadCount(0)}>
                Clear
              </Button>
            </Stack>
          </Paper>

          {/* ── 9. Avatar (Profile badge) ── */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Avatar — Profile Badge
            </Typography>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <Avatar alt="User Avatar" src="/broken-image.jpg">
                JD
              </Avatar>
              <Avatar sx={{ bgcolor: "primary.main" }}>JD</Avatar>
              <Avatar sx={{ bgcolor: "success.main" }}>SM</Avatar>
              <Avatar sx={{ bgcolor: "secondary.main" }}>AK</Avatar>
              <Avatar
                alt="Remy Sharp"
                src="https://mui.com/static/images/avatar/1.jpg"
              />
              <Avatar variant="rounded" sx={{ bgcolor: "error.main" }}>
                RR
              </Avatar>
              <Avatar variant="square" sx={{ bgcolor: "warning.main" }}>
                WP
              </Avatar>
            </Stack>
            <Stack
              direction="row"
              spacing={2}
              sx={{ alignItems: "center", mt: 2 }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: 14,
                  bgcolor: "info.main",
                }}
              >
                XS
              </Avatar>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  fontSize: 24,
                  bgcolor: "primary.main",
                }}
              >
                LG
              </Avatar>
            </Stack>
          </Paper>

          {/* ── 10. Chip (Filter or status tag) ── */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Chip — Filter / Status Tag
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Click to toggle selection. Click the X to remove.
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              sx={{ flexWrap: "wrap" }}
            >
              {["React", "TypeScript", "MUI", "GraphQL", "Node.js"].map(
                (chip) => {
                  const selected = selectedChips.includes(chip);
                  return (
                    <Chip
                      key={chip}
                      label={chip}
                      variant={selected ? "filled" : "outlined"}
                      color={selected ? "primary" : "default"}
                      onClick={() => handleChipClick(chip)}
                      onDelete={
                        selected ? () => handleDeleteChip(chip) : undefined
                      }
                    />
                  );
                },
              )}
            </Stack>
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              sx={{ flexWrap: "wrap", mt: 2 }}
            >
              <Chip label="Success" color="success" />
              <Chip label="Warning" color="warning" />
              <Chip label="Error" color="error" />
              <Chip label="Info" color="info" />
              <Chip label="Disabled" disabled />
              <Chip label="Small" size="small" color="primary" />
              <Chip
                avatar={<Avatar>JD</Avatar>}
                label="With Avatar"
                onDelete={() => {}}
              />
            </Stack>
          </Paper>
        </Box>
      </Box>
      <RouterBreadcrumbs />
      <Box sx={{ width: 200 }}>
        <Typography gutterBottom>Volume: {val}%</Typography>
        <Slider
          value={val}
          onChange={(_, newVal) => setVal(newVal)}
          valueLabelDisplay="auto"
          min={0}
          max={100}
        />
      </Box>

      <Stack spacing={1} sx={{ width: 300 }}>
        {/* Profile picture loader */}
        <Skeleton variant="circular" width={40} height={40} />
        {/* Title loader */}
        <Skeleton variant="text" sx={{ fontSize: "1rem" }} />
        {/* Card media loader */}
        <Skeleton variant="rounded" width={210} height={118} />
      </Stack>
    </div>
  );
}
