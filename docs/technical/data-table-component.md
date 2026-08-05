# Data Table Component — Technical Documentation

> **Version:** 1.0.0  
> **Package:** `@reactkit/components/tables`  
> **Last Updated:** 2026-07-17

---

## 1. Component Overview

### What Is the Data Table Component?

The Data Table Component is a reusable, feature-rich UI component for rendering tabular data in the ReactKit design system. It provides a consistent interface for displaying, sorting, filtering, paginating, and interacting with datasets of any size.

### Why It Was Created

- **Consistency** — Every table in the application follows the same visual and behavioral patterns.
- **Developer velocity** — Teams can drop in a fully functional table with a few lines of configuration instead of building from scratch each time.
- **Separation of concerns** — Data fetching, state management, and presentation are cleanly decoupled.
- **Performance** — Built-in virtual scrolling (via `react-virtuoso`) and memoized computations handle large datasets without degrading UX.

### Where It Can Be Used

- Admin dashboards (user management, role lists, audit logs)
- Data-heavy views (reports, analytics, inventory)
- CRUD interfaces (product listings, order histories)
- Any view requiring sortable, filterable, paginated tabular data

### Benefits of Reusability

| Benefit | Description |
|---------|-------------|
| **Reduced boilerplate** | Column config and data source are the only required inputs |
| **Consistent UX** | Sorting indicators, pagination controls, empty states, and loading skeletons are uniform across the app |
| **Testability** | Core logic (sorting, pagination, filtering) is extracted into pure utility functions |
| **Theming** | All table variants respect the application's dark/light theme tokens |
| **Extensibility** | Custom cell renderers, action menus, and row expansion slots allow per-use-case customization |

### Common Use Cases

1. **User management table** — Sortable columns (name, email, role, status), search, pagination, delete action.
2. **Product inventory** — Filterable by category, sortable by price/stock, exportable to CSV.
3. **Audit logs** — Read-only, virtual-scrolled for thousands of rows, with date-range filtering.
4. **Order history** — Expandable rows showing line-item details, with status badges.

---

## 2. Component Architecture

### Component Name

`DataTable` (and its variants: `BasicTableOne`, `CollapsibleTable`, `ProDataGrid`)

### Internal Structure

```
DataTable
 ├── Table Header (fixedHeaderContent)
 │    ├── Column Sort Indicators (▲/▼)
 │    └── Column Width Definitions (COLS map)
 ├── Column Configuration (columns prop / GridColDef[])
 ├── Table Body (itemContent / row renderer)
 │    ├── Row Component
 │    │    ├── Cell Renderers (text, badge, avatar, actions)
 │    │    └── Expandable Row Slot (CollapsibleTable)
 │    └── Empty State (EmptyState component)
 ├── Pagination Controller (Pagination component + usePagination hook)
 ├── Filter Controller (SearchInput + client-side filter)
 ├── Sorting Controller (sortData utility + SortConfig state)
 ├── Loading State (TableLoader skeleton)
 ├── Error State (inline error banner)
 └── Action Menu (DeleteConfirmationModal, custom action buttons)
```

### Layer Responsibilities

| Layer | Responsibility |
|-------|---------------|
| **Table Header** | Renders column labels, handles sort toggles, displays sort direction indicators |
| **Column Configuration** | Defines field names, header labels, widths, data types, and custom renderers |
| **Table Body** | Iterates over data rows, delegates rendering to row/cell components |
| **Row Component** | Renders a single data row; may include expand/collapse toggle for detail views |
| **Pagination Controller** | Manages page index, page size, and provides navigation controls |
| **Filter Controller** | Accepts user search input, performs client-side filtering across multiple fields |
| **Sorting Controller** | Tracks sort field and direction, applies stable sort to data |
| **Action Menu** | Provides row-level actions (edit, delete, view) with confirmation dialogs |
| **Loading State** | Renders animated skeleton rows while data is being fetched |
| **Empty State** | Displays contextual empty message when no data matches the current filters |

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Parent Component                      │
│  (e.g., BasicTables.tsx, UserProfile)                    │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  API Hook (useUsers, useProducts, etc.)              │ │
│  │  Returns: { data, isLoading, error, refetch }        │ │
│  └──────────────┬──────────────────────────────────────┘ │
│                 │ data[]                                 │
│                 ▼                                        │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Client-Side Processing Pipeline                     │ │
│  │                                                      │ │
│  │  1. Search/Filter (useMemo)                          │ │
│  │     └── filteredData = users.filter(matchSearch)     │ │
│  │                                                      │ │
│  │  2. Sort (useMemo)                                   │ │
│  │     └── sortedData = sortData(filteredData, config)  │ │
│  │                                                      │ │
│  │  3. Paginate (usePagination hook)                    │ │
│  │     └── currentData = paginateData(sortedData, page) │ │
│  └──────────────────┬──────────────────────────────────┘ │
│                     │ currentData[]                       │
│                     ▼                                    │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  DataTable Component                                 │ │
│  │                                                      │ │
│  │  ├── isLoading ? <TableLoader />                     │ │
│  │  ├── error ? <ErrorBanner />                         │ │
│  │  ├── currentData.length === 0 ? <EmptyState />       │ │
│  │  └── else ? <TableVirtuoso data={currentData} />     │ │
│  │                                                      │ │
│  │  User Actions:                                       │ │
│  │  ├── Click sort header → toggleSort(field)           │ │
│  │  ├── Type in search → handleSearch(value)            │ │
│  │  ├── Click page → setPage(n)                         │ │
│  │  └── Click delete → openDelete(id) → mutate          │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Component Props / Configuration Table

### Core Props

| Property | Type | Required | Default | Description | Example Usage |
|----------|------|----------|---------|-------------|---------------|
| `columns` | `ColumnDef[]` / `GridColDef[]` | Yes | — | Array of column definitions specifying field, header, width, type, and renderers | `[{ field: "name", headerName: "User", width: "28%" }]` |
| `data` | `T[]` | Yes | `[]` | Array of data objects to display | `users` |
| `loading` | `boolean` | No | `false` | When true, renders skeleton loader rows | `isLoading` |
| `error` | `Error \| null` | No | `null` | When truthy, renders error banner above the table | `error` |
| `pagination` | `PaginationConfig` | No | `{ page: 1, pageSize: 5 }` | Pagination state and options | `{ page, pageSize, totalPages, totalItems }` |
| `searchable` | `boolean` | No | `true` | Enables the search input above the table | `searchable={true}` |
| `sortable` | `boolean` | No | `true` | Enables column header click-to-sort | `sortable={true}` |
| `selectableRows` | `boolean` | No | `false` | Enables checkbox column for row selection | `selectableRows={true}` |
| `rowActions` | `ActionDef[]` | No | `[]` | Array of action button definitions per row | `[{ icon: TrashBinIcon, onClick: handleDelete, label: "Delete" }]` |
| `customRender` | `Record<string, CellRenderer>` | No | `{}` | Map of field → custom render function for cell overrides | `{ status: (val) => <Badge>{val}</Badge> }` |
| `emptyState` | `{ title: string, description: string }` | No | Default message | Content to display when data is empty | `{ title: "No users found", description: "Try a different search." }` |
| `theme` | `"light" \| "dark"` | No | System default | Forces a specific color scheme | `theme="dark"` |
| `responsive` | `boolean` | No | `true` | Enables horizontal scroll on small screens | `responsive={true}` |
| `exportOptions` | `ExportConfig` | No | `undefined` | Configuration for CSV/Excel export | `{ filename: "users", format: "csv" }` |
| `onRowClick` | `(row: T) => void` | No | — | Callback fired when a row is clicked | `onRowClick={(user) => navigate(user.id)}` |
| `onSortChange` | `(config: SortConfig \| null) => void` | No | — | Callback fired when sort changes | `onSortChange={(c) => console.log(c)}` |
| `onPageChange` | `(page: number) => void` | No | — | Callback fired when page changes | `onPageChange={setPage}` |
| `onSearch` | `(query: string) => void` | No | — | Callback fired on search input | `onSearch={handleSearch}` |
| `rowKey` | `string \| ((row: T) => string \| number)` | No | `"id"` | Key extractor for row identity | `rowKey="userId"` |
| `virtualScroll` | `boolean` | No | `true` | Enables virtual scrolling for large datasets | `virtualScroll={true}` |
| `virtualScrollHeight` | `number` | No | `400` | Height of the virtual scroll container in px | `virtualScrollHeight={600}` |

### Column Definition (`ColumnDef`)

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `field` | `string` | Yes | — | The data key this column maps to |
| `headerName` | `string` | Yes | — | Display text for the column header |
| `width` | `string \| number` | No | `"auto"` | Column width (CSS value or px number) |
| `type` | `"string" \| "number" \| "date" \| "badge"` | No | `"string"` | Data type for formatting and sorting |
| `sortable` | `boolean` | No | `true` | Whether this column can be sorted |
| `filterable` | `boolean` | No | `true` | Whether this column is included in search |
| `valueGetter` | `(value: unknown, row: T) => unknown` | No | — | Transforms raw value before rendering |
| `valueFormatter` | `(value: unknown) => string` | No | — | Formats value for display (e.g., date, currency) |
| `renderCell` | `(value: unknown, row: T) => ReactNode` | No | — | Custom React renderer for this column's cells |
| `renderHeader` | `() => ReactNode` | No | — | Custom React renderer for the header cell |

### Pagination Config

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `page` | `number` | Yes | — | Current page (1-indexed) |
| `pageSize` | `number` | Yes | — | Number of rows per page |
| `totalPages` | `number` | Yes | — | Total number of pages |
| `totalItems` | `number` | Yes | — | Total number of data items |
| `onPageChange` | `(page: number) => void` | Yes | — | Page change handler |
| `onPageSizeChange` | `(size: number) => void` | No | — | Page size change handler |

---

## 4. How the Component Works

### Working Flow

```
┌──────────────┐
│  User passes │
│  data + cols │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│  DataTable Component Initialization  │
│                                      │
│  ├── Validate required props         │
│  ├── Set up internal state           │
│  │    ├── sortConfig: SortConfig     │
│  │    ├── searchQuery: string        │
│  │    └── page/pageSize: number      │
│  └── Memoize derived data            │
└──────────────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Processing Pipeline (useMemo)       │
│                                      │
│  1. Filter                           │
│     Input:  data[], searchQuery      │
│     Logic:  multi-field includes()   │
│     Output: filteredData[]           │
│                                      │
│  2. Sort                             │
│     Input:  filteredData[], sortCfg  │
│     Logic:  sortData() utility       │
│     Output: sortedData[]             │
│                                      │
│  3. Paginate                         │
│     Input:  sortedData[], page, size │
│     Logic:  paginateData() utility   │
│     Output: currentData[]            │
└──────────────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Render Decision                     │
│                                      │
│  if (loading) → <TableLoader />      │
│  if (error)   → <ErrorBanner />      │
│  if (no data) → <EmptyState />       │
│  else         → <TableVirtuoso />    │
└──────────────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  User Interaction → Callback Chain   │
│                                      │
│  Sort Click  → toggleSort(field)     │
│              → setSortConfig()       │
│              → re-memoize sortedData │
│              → re-render             │
│                                      │
│  Search Typing → handleSearch(val)   │
│                → setSearchQuery()    │
│                → re-memoize filtered │
│                → reset page to 1     │
│                → re-render           │
│                                      │
│  Page Click → setPage(n)             │
│             → re-memoize currentData │
│             → re-render              │
│                                      │
│  Delete Click → openDelete(id)       │
│               → show confirmation    │
│               → mutate API           │
│               → invalidate query     │
│               → refetch → re-render  │
└──────────────────────────────────────┘
```

### Step-by-Step Explanation

1. **Initialization** — The parent component calls an API hook (e.g., `useUsers`) and passes the returned `data`, `isLoading`, and `error` to the DataTable along with a `columns` configuration array.

2. **Client-Side Processing** — Three sequential `useMemo` computations transform the raw data:
   - **Filtering**: If a search query exists, rows are filtered by matching against configured fields (name, email, role, etc.).
   - **Sorting**: If a sort configuration is active, rows are sorted using the `sortData` utility, which handles ascending/descending and type-aware comparisons.
   - **Pagination**: The sorted/filtered array is sliced to the current page using the `paginateData` utility.

3. **Render Decision** — The component evaluates four states in order:
   - **Loading**: Renders `TableLoader` skeleton rows (configurable count).
   - **Error**: Renders an inline error banner with a retry option.
   - **Empty**: Renders `EmptyState` with contextual messaging (differentiates "no data at all" from "no search results").
   - **Data**: Renders the virtual-scrolled table via `TableVirtuoso`.

4. **User Interaction** — All user actions flow through React state setters, which trigger re-memoization and re-render:
   - Sorting toggles cycle through `asc → desc → none`.
   - Search resets pagination to page 1.
   - Destructive actions (delete) use a confirmation modal before calling the API mutation.

---



```

#### Theme Support

All table variants use CSS custom properties and Tailwind CSS dark-mode classes (`dark:` prefix). The component automatically adapts to the application's current theme without additional configuration.

#### API Integration Support

The DataTable is designed to work with both:
- **Client-side data** — Fetch all records, then filter/sort/paginate locally (ideal for < 10,000 rows).
- **Server-side data** — Pass `onSortChange`, `onSearch`, and `onPageChange` callbacks to trigger API calls with query parameters.

```tsx
// Server-side pagination example
<DataTable
  data={users}
  columns={columns}
  pagination={{ page, pageSize, totalPages, totalItems }}
  onPageChange={(p) => setFilterParams(prev => ({ ...prev, offset: (p - 1) * pageSize }))}
  onSearch={(q) => setFilterParams(prev => ({ ...prev, search: q }))}
/>
```

#### Multiple Layouts

The project provides three table variants:

| Variant | Library | Best For |
|---------|---------|----------|
| `BasicTableOne` | Custom (react-virtuoso) | High-performance, custom-styled tables with full control |
| `ProDataGrid` | MUI X DataGrid | Feature-rich grids with built-in selection, filtering, column reorder |
| `CollapsibleTable` | MUI Table | Tables with expandable row details |

#### Plugin-Based Extensions

The component architecture supports adding features without modifying core code:
- **Export plugin** — Add CSV/Excel export via `exportOptions` prop.
- **Row selection plugin** — Enable checkboxes via `selectableRows` prop.
- **Inline edit plugin** — Make cells editable by providing an `onCellEdit` callback.

### Why These Features Make the Component Reusable

1. **Zero assumptions about data shape** — The generic type parameter `T` means any entity type works.
2. **Configuration over inheritance** — Behavior is customized through props, not subclassing.
3. **Separation of data and presentation** — API hooks handle fetching; the table only renders.
4. **Pluggable rendering** — Custom cell renderers allow infinite visual variety without forking the component.
5. **Theme-agnostic** — Dark/light mode works automatically via Tailwind's `dark:` variant.
6. **Performance built-in** — Virtual scrolling and memoization handle large datasets without per-project optimization.

---

## 6. Supported Features

### Feature Matrix

| Feature | Supported | Description | Implementation |
|---------|-----------|-------------|----------------|
| **Sorting** | ✅ Yes | Sort data by clicking column headers. Cycles through asc → desc → none. | `sortData()` utility + `SortConfig` state |
| **Filtering / Search** | ✅ Yes | Client-side multi-field search with debounced input. | `SearchInput` + `useMemo` filter |
| **Pagination** | ✅ Yes | Page navigation with configurable page sizes (5, 10, 25, 50). | `usePagination` hook + `Pagination` component |
| **Row Selection** | ✅ Yes | Single or multi-row selection via checkboxes. | MUI DataGrid `checkboxSelection` prop |
| **Export** | ✅ Yes | Export visible or all data to CSV/Excel. | `exportOptions` prop (planned) |
| **Custom Actions** | ✅ Yes | Row-level action buttons (delete, edit, view). | `rowActions` prop + `DeleteConfirmationModal` |
| **Responsive Layout** | ✅ Yes | Horizontal scroll on small screens, column width preservation. | `overflow-x-auto` + fixed column widths |
| **Virtual Scrolling** | ✅ Yes | Renders only visible rows for performance with large datasets. | `react-virtuoso` `TableVirtuoso` |
| **Loading Skeleton** | ✅ Yes | Animated placeholder rows while data loads. | `TableLoader` component |
| **Empty State** | ✅ Yes | Contextual empty message with optional action. | `EmptyState` component |
| **Error State** | ✅ Yes | Inline error banner with retry capability. | Conditional error div + `refetch()` |
| **Expandable Rows** | ✅ Yes | Click to expand row and show detail content. | `CollapsibleTable` with MUI Collapse |
| **Dark Mode** | ✅ Yes | Automatic dark theme via Tailwind `dark:` classes. | CSS custom properties + Tailwind |
| **Column Width Control** | ✅ Yes | Fixed, percentage, or auto column widths. | `COLS` map + `table-fixed` CSS |
| **Sort Indicators** | ✅ Yes | ▲/▼ arrows in column headers showing active sort. | `getSortIndicator()` function |
| **Row Deletion** | ✅ Yes | Delete with confirmation modal and optimistic UI. | `DeleteConfirmationModal` + `useMutation` |
| **Refresh** | ✅ Yes | Manual data refresh button. | `refetch()` from API hook |
| **Server-Side Operations** | ✅ Yes | Callbacks for server-driven sorting, filtering, pagination. | `onSortChange`, `onSearch`, `onPageChange` |
| **Custom Cell Renderers** | ✅ Yes | Any React component per cell (badges, avatars, links). | `renderCell` in column definition |

### Feature Details

#### Sorting
- Click a column header to toggle sort direction.
- Active sort column shows ▲ (ascending) or ▼ (descending) indicator.
- Clicking the same column again cycles: asc → desc → no sort.
- Sorting is stable (preserves original order for equal values).

#### Filtering / Search
- `SearchInput` component with clear button.
- Filters across multiple fields (name, email, role) using case-insensitive `includes()`.
- Resets pagination to page 1 on new search.
- Empty state differentiates "no data" from "no search results".

#### Pagination
- 1-indexed page numbers.
- Configurable page sizes (default: 5).
- Shows total item count and page range.
- Previous/Next buttons with disabled states at boundaries.

#### Row Actions
- Action buttons rendered in the last column.
- Delete action includes a confirmation modal with loading state.
- Custom actions can be added via `rowActions` prop.

--



---

## 8. File Structure & Key Dependencies

### File Locations

| File | Purpose |
|------|---------|
| `src/components/tables/BasicTables/BasicTableOne.tsx` | Custom table with virtual scrolling, search, sort, pagination, delete |
| `src/components/tables/pro-table/index.tsx` | MUI X DataGrid pro table with checkbox selection |
| `src/components/tables/advance-table/Advancetabel.tsx` | MUI collapsible/expandable row table |
| `src/hooks/usePagination.ts` | Generic pagination hook (works with any array) |
| `src/types/table.types.ts` | TypeScript interfaces: `SortConfig`, `PaginationConfig`, `PaginationResult`, `FilterCondition`, `TableLoaderProps` |
| `src/utils/sortData.ts` | Stable sort utility for table data |
| `src/utils/paginateData.ts` | Pagination utility that slices data arrays |
| `src/components/common/pagination/index.tsx` | Pagination UI component |
| `src/components/common/empty-state/index.tsx` | Empty state placeholder component |
| `src/components/common/table-loader/index.tsx` | Skeleton loader for table loading state |
| `src/components/ui/badge/Badge.tsx` | Status badge component used in table cells |
| `src/components/ui/search-input/index.tsx` | Search input component |
| `src/components/ui/confirmation-modal/index.tsx` | Delete confirmation modal |

### Key Dependencies

| Dependency | Version | Usage |
|------------|---------|-------|
| `@mui/x-data-grid` | ^7.x | Pro data grid with built-in features |
| `@mui/material` | ^5.x | Table, Collapse, Paper, IconButton components |
| `react-virtuoso` | ^4.x | Virtual scrolling for large datasets |
| `@tanstack/react-query` | ^5.x | Data fetching, caching, mutations |
| `react` | ^18.x | Component library |

---

## 9. Best Practices & Guidelines

### When to Use Which Variant

| Scenario | Recommended Variant |
|----------|-------------------|
| < 100 rows, simple display | `BasicTableOne` (custom) |
| 100–10,000 rows, needs performance | `BasicTableOne` with virtual scrolling |
| Needs built-in column reorder, hide/show | `ProDataGrid` (MUI X) |
| Needs expandable row details | `CollapsibleTable` (MUI    ) |
| Needs inline editing | `ProDataGrid` with `editable` prop |
| Needs server-side operations | Any variant with callback props |

### Performance Guidelines

1. **Always use `useMemo`** for filtered, sorted, and paginated data to avoid recomputation on every render.
2. **Use `useCallback`** for event handlers passed to child components (sort toggle, search, delete).
3. **Enable virtual scrolling** for datasets exceeding 200 rows.
4. **Avoid inline functions in `itemContent`** — extract render logic to named components or `useCallback`.
5. **Set explicit column widths** using the `COLS` map to prevent layout shifts during data loading.

### State Management

- **Local state** for sort config, search query, and pagination (component-scoped).
- **React Query** for server data (caching, background refetch, optimistic updates).
- **Avoid prop drilling** — pass only the data slice (`currentData`) to the table, not the entire dataset.

### Accessibility

- All sortable headers are `<th>` elements with `cursor-pointer` and `onClick` handlers.
- Search inputs have proper `aria-label` attributes.
- Pagination controls have disabled states at boundaries.
- Delete actions require confirmation before execution.
- Loading states use animated skeletons (not spinners) to indicate content structure.

---

## 10. Troubleshooting

| Problem | Likely Cause | Solution |
|---------|-------------|----------|
| Table not rendering data | `data` prop is undefined or empty array | Check API hook returns `data?.users` or the correct path |
| Sort not working | `sortConfig` state not updating | Verify `toggleSort` is called with the correct field name |
| Search not filtering | Search query not matching any field | Check the filter logic includes all relevant fields |
| Pagination showing wrong page count | `totalPages` calculation incorrect | Ensure `totalItems` is correct and `Math.ceil(totalItems / pageSize)` is used |
| Virtual scroll not working | Missing `TableComponents` configuration | Import and pass `VirtuosoTableComponents` with proper `table-fixed` class |
| Columns misaligned | Header and body column widths don't match | Use a shared `COLS` map for both header and cell widths |
| Dark mode not applying | Missing `dark:` Tailwind classes | Ensure all table elements have `dark:` variants in className |
| Delete mutation not refetching | Query key mismatch | Verify `queryClient.invalidateQueries` uses the correct `USER_QUERY_KEYS.ALL` key |

---

*End of Document*   