import { safeRegExpFromUser } from '@aibos/utils';
import { safeGet } from '@aibos/utils';
import { safeJoin } from '@aibos/utils';
const BASE_DIR = process.cwd();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Codemod to rename abbreviations to full names
const renameMap = {
  // Function/variable names
  composeRefs: 'composeReferences',
  dataAttr: 'dataAttribute',
  ariaAttr: 'ariaAttribute',

  // Type names (Props -> Properties)
  BreadcrumbsProps: 'BreadcrumbsProperties',
  BreadcrumbItemProps: 'BreadcrumbItemProperties',
  CommandPaletteProps: 'CommandPaletteProperties',
  CommandGroupProps: 'CommandGroupProperties',
  CommandItemProps: 'CommandItemProperties',
  PaginationProps: 'PaginationProperties',
  PaginationItemProps: 'PaginationItemProperties',
  DropdownProps: 'DropdownProperties',
  DropdownTriggerProps: 'DropdownTriggerProperties',
  DropdownContentProps: 'DropdownContentProperties',
  ModalProps: 'ModalProperties',
  ModalHeaderProps: 'ModalHeaderProperties',
  ModalContentProps: 'ModalContentProperties',
  ModalFooterProps: 'ModalFooterProperties',
  PopoverProps: 'PopoverProperties',
  PopoverTriggerProps: 'PopoverTriggerProperties',
  PopoverContentProps: 'PopoverContentProperties',
  TooltipProps: 'TooltipProperties',
  TooltipTriggerProps: 'TooltipTriggerProperties',
  TooltipContentProps: 'TooltipContentProperties',
  SidebarProps: 'SidebarProperties',
  SidebarHeaderProps: 'SidebarHeaderProperties',
  SidebarContentProps: 'SidebarContentProperties',
  FlexProps: 'FlexProperties',
  FlexItemProps: 'FlexItemProperties',
  GridProps: 'GridProperties',
  GridItemProps: 'GridItemProperties',
  ContainerProps: 'ContainerProperties',
  DrawerProps: 'DrawerProperties',
  DrawerHeaderProps: 'DrawerHeaderProperties',
  DrawerContentProps: 'DrawerContentProperties',
  SplitViewProps: 'SplitViewProperties',
  SplitViewPanelProps: 'SplitViewPanelProperties',
  TabsProps: 'TabsProperties',
  TabsListProps: 'TabsListProperties',
  TabsTriggerProps: 'TabsTriggerProperties',
  TabsContentProps: 'TabsContentProperties',
  NavbarProps: 'NavbarProperties',
  NavbarBrandProps: 'NavbarBrandProperties',
  NavbarNavProps: 'NavbarNavProperties',
  NavbarItemProps: 'NavbarItemProperties',
  NavbarToggleProps: 'NavbarToggleProperties',
  PrintProps: 'PrintProperties',
  PrintPreviewProps: 'PrintPreviewProperties',
  ResponsiveContainerProps: 'ResponsiveContainerProperties',
  TouchButtonProps: 'TouchButtonProperties',
  MobileNavProps: 'MobileNavProperties',
  OfflineSyncProps: 'OfflineSyncProperties',
  BadgeProps: 'BadgeProperties',
  ButtonProps: 'ButtonProperties',
  CardProps: 'CardProperties',
  CardHeaderProps: 'CardHeaderProperties',
  CardTitleProps: 'CardTitleProperties',
  CardDescriptionProps: 'CardDescriptionProperties',
  CardContentProps: 'CardContentProperties',
  CardFooterProps: 'CardFooterProperties',
  InputProps: 'InputProperties',
  InputGroupProps: 'InputGroupProperties',
  InputAddonProps: 'InputAddonProperties',
  IconProps: 'IconProperties',
  IconButtonProps: 'IconButtonProperties',
  IconTextProps: 'IconTextProperties',
  HistoryManagerProps: 'HistoryManagerProperties',
  UndoRedoProps: 'UndoRedoProperties',
  UndoRedoSystemProps: 'UndoRedoSystemProperties',
  SmartWrapperProps: 'SmartWrapperProperties',
  ComponentConfig: 'ComponentConfiguration',
  createDualModeProps: 'createDualModeProperties',
  PolymorphicProps: 'PolymorphicProperties',
  PolymorphicRef: 'PolymorphicReference',

  // Variable names
  drawerRef: 'drawerReference',
  previousFocusRef: 'previousFocusReference',
  prevHistory: 'previousHistory',
  prevIndex: 'previousIndex',
  prev: 'previous',

  // Event parameter names
  e: 'event', // This will be handled more carefully
};

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Apply renames
    for (const [oldName, newName] of Object.entries(renameMap)) {
      // Use word boundaries to avoid partial replacements
      const regex = safeRegExpFromUser(`\\b${oldName}\\b`, 'g');
      if (content.includes(oldName)) {
        content = content.replace(regex, newName);
        modified = true;
      }
    }

    // Special handling for event parameter 'e' -> 'event'
    // Only replace in function parameters and destructuring
    content = content.replace(/(\w+)\s*\(\s*e\s*\)/g, '$1(event)');
    content = content.replace(/(\w+)\s*\(\s*e\s*,\s*/g, '$1(event, ');
    content = content.replace(/{\s*e\s*}/g, '{event}');
    content = content.replace(/{\s*e\s*,\s*/g, '{event, ');

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dirPath) {
  const files = fs.readdirSync(safeJoin(BASE_DIR, dirPath));

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(safeJoin(BASE_DIR, fullPath));

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      processDirectory(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

// Main execution
const targetDir = process.argv[2] || 'packages/ui/src';
console.log(`🔄 Processing abbreviations in: ${targetDir}`);
processDirectory(targetDir);
console.log('✅ Abbreviation renaming complete!');
