/**
 * Menubar 组件封装
 * 基于 @radix-ui/react-menubar，提供类似 3rd/md 的 API
 * 原生支持鼠标悬停切换菜单
 */

import * as MenubarPrimitive from '@radix-ui/react-menubar';
import { ChevronRight, Check } from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MenubarProps {
  children: ReactNode;
  className?: string;
}

export function Menubar({ children, className = '' }: MenubarProps) {
  return (
    <MenubarPrimitive.Root
      className={cn(
        'flex h-10 items-center gap-x-1 rounded-md border-0 bg-transparent p-0',
        className
      )}
    >
      {children}
    </MenubarPrimitive.Root>
  );
}

interface MenubarMenuProps {
  children: ReactNode;
}

export function MenubarMenu({ children }: MenubarMenuProps) {
  return <MenubarPrimitive.Menu>{children}</MenubarPrimitive.Menu>;
}

interface MenubarTriggerProps {
  children: ReactNode;
  className?: string;
}

export function MenubarTrigger({ children, className = '' }: MenubarTriggerProps) {
  return (
    <MenubarPrimitive.Trigger
      className={cn(
        'flex cursor-default select-none items-center rounded-sm px-3 py-1.5 text-sm font-medium outline-hidden',
        'hover:bg-gray-100 dark:hover:bg-gray-700',
        'focus:bg-gray-100 dark:focus:bg-gray-700',
        'data-[state=open]:bg-gray-100 dark:data-[state=open]:bg-gray-700',
        'text-gray-700 dark:text-gray-300',
        className
      )}
    >
      {children}
    </MenubarPrimitive.Trigger>
  );
}

interface MenubarContentProps {
  children: ReactNode;
  className?: string;
  align?: 'start' | 'end' | 'center';
  alignOffset?: number;
  sideOffset?: number;
}

export function MenubarContent({
  children,
  className = '',
  align = 'start',
  alignOffset = -4,
  sideOffset = 8,
}: MenubarContentProps) {
  return (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.Content
        align={align}
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-[12rem] overflow-hidden rounded-md border bg-white dark:bg-gray-800 p-1',
          'text-gray-900 dark:text-gray-100 shadow-md',
          'data-[state=open]:animate-in data-[state=closed]:fade-out-0',
          'data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95',
          'data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2',
          'data-[side=left]:slide-in-from-right-2',
          'data-[side=right]:slide-in-from-left-2',
          'data-[side=top]:slide-in-from-bottom-2',
          className
        )}
      >
        {children}
      </MenubarPrimitive.Content>
    </MenubarPrimitive.Portal>
  );
}

interface MenubarItemProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  inset?: boolean;
  disabled?: boolean;
}

export function MenubarItem({
  children,
  onClick,
  className = '',
  inset = false,
  disabled = false,
}: MenubarItemProps) {
  return (
    <MenubarPrimitive.Item
      disabled={disabled}
      className={cn(
        'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden',
        'focus:bg-gray-100 dark:focus:bg-gray-700',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        'text-gray-700 dark:text-gray-300',
        inset && 'pl-8',
        className
      )}
      onSelect={(e) => {
        e.preventDefault();
        onClick?.();
      }}
    >
      {children}
    </MenubarPrimitive.Item>
  );
}

interface MenubarSeparatorProps {
  className?: string;
}

export function MenubarSeparator({ className = '' }: MenubarSeparatorProps) {
  return (
    <MenubarPrimitive.Separator
      className={cn('my-1 h-px bg-gray-200 dark:bg-gray-700', className)}
    />
  );
}

interface MenubarShortcutProps {
  children: ReactNode;
}

export function MenubarShortcut({ children }: MenubarShortcutProps) {
  return (
    <span className="ml-auto flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
      {children}
    </span>
  );
}

// 嵌套子菜单支持
interface MenubarSubProps {
  children: ReactNode;
}

export function MenubarSub({ children }: MenubarSubProps) {
  return <MenubarPrimitive.Sub>{children}</MenubarPrimitive.Sub>;
}

interface MenubarSubTriggerProps {
  children: ReactNode;
  className?: string;
  inset?: boolean;
}

export function MenubarSubTrigger({
  children,
  className = '',
  inset = false,
}: MenubarSubTriggerProps) {
  return (
    <MenubarPrimitive.SubTrigger
      className={cn(
        'flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden',
        'focus:bg-gray-100 dark:focus:bg-gray-700',
        'data-[state=open]:bg-gray-100 dark:data-[state=open]:bg-gray-700',
        'text-gray-700 dark:text-gray-300',
        inset && 'pl-8',
        className
      )}
    >
      {children}
      <ChevronRight className="ml-auto h-4 w-4" />
    </MenubarPrimitive.SubTrigger>
  );
}

interface MenubarSubContentProps {
  children: ReactNode;
  className?: string;
  alignOffset?: number;
  sideOffset?: number;
}

export function MenubarSubContent({
  children,
  className = '',
  alignOffset = -4,
  sideOffset = 8,
}: MenubarSubContentProps) {
  return (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.SubContent
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white dark:bg-gray-800 p-1',
          'text-gray-900 dark:text-gray-100 shadow-lg',
          'data-[state=open]:animate-in data-[state=closed]:fade-out-0',
          'data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95',
          'data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2',
          'data-[side=left]:slide-in-from-right-2',
          'data-[side=right]:slide-in-from-left-2',
          'data-[side=top]:slide-in-from-bottom-2',
          className
        )}
      >
        {children}
      </MenubarPrimitive.SubContent>
    </MenubarPrimitive.Portal>
  );
}

interface MenubarCheckboxItemProps {
  children: ReactNode;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export function MenubarCheckboxItem({
  children,
  checked = false,
  onCheckedChange,
  className = '',
  disabled = false,
}: MenubarCheckboxItemProps) {
  return (
    <MenubarPrimitive.CheckboxItem
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn(
        'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-hidden',
        'focus:bg-gray-100 dark:focus:bg-gray-700',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        'text-gray-700 dark:text-gray-300',
        className
      )}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <MenubarPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.CheckboxItem>
  );
}
