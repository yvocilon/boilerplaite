# UI Guidelines

## Design

- Use shadcn components when available
- SHOULD use existing theme or Tailwind CSS color tokens before introducing new ones
- SHOULD limit accent color usage to one per view
- MUST give empty states one clear next action
- SHOULD use Tailwind CSS default shadow scale unless explicitly requested
- NEVER use glow effects as primary affordances
- NEVER use purple or multicolor gradients
- NEVER use gradients unless explicitly requested

## Performance

- NEVER use useEffect for anything that can be expressed as render logic
- NEVER apply will-change outside an active animation
- NEVER animate large blur() or backdrop-filter surfaces

## Layout

- MUST use a fixed z-index scale (no arbitrary z-*)
- SHOULD use size-* for square elements instead of w-* + h-*

## Typography

- MUST use text-balance for headings and text-pretty for body/paragraphs
- MUST use tabular-nums for data
- SHOULD use truncate or line-clamp for dense UI
- NEVER modify letter-spacing (tracking-*) unless explicitly requested

## Animation

- NEVER add animation unless explicitly requested
- MUST animate only compositor props (transform, opacity)
- NEVER animate layout properties (width, height, top, left, margin, padding)
- SHOULD avoid animating paint properties (background, color) except for small, local UI (text, icons)
- SHOULD use ease-out on entrance
- NEVER exceed 200ms for interaction feedback
- MUST pause looping animations when off-screen
- SHOULD respect prefers-reduced-motion
- NEVER introduce custom easing curves unless explicitly requested
- SHOULD avoid animating large images or full-screen surfaces

## Interaction

- MUST use an AlertDialog for destructive or irreversible actions
- SHOULD use structural skeletons for loading states
- NEVER use h-screen, use h-dvh
- MUST respect safe-area-inset for fixed elements
- MUST show errors next to where the action happens
- NEVER block paste in input or textarea elements

## Components

- NEVER rebuild keyboard or focus behavior by hand unless explicitly requested
- MUST use accessible component primitives for anything with keyboard or focus behavior (Base UI, React Aria, Radix)
- MUST use the project's existing component primitives first
- NEVER mix primitive systems within the same interaction surface
- SHOULD prefer Base UI for new primitives if compatible with the stack
- MUST add an aria-label to icon-only buttons

## Stack

- MUST use Tailwind CSS defaults unless custom values already exist or are explicitly requested
- MUST use motion/react (formerly framer-motion) when JavaScript animation is required
- SHOULD use tw-animate-css for entrance and micro-animations in Tailwind CSS
- MUST use cn utility (clsx + tailwind-merge) for class logic

## Z-Index Scale

```
z-0    Base content
z-10   Sticky headers, floating elements
z-20   Dropdowns, popovers
z-30   Modals backdrop
z-40   Modals content
z-50   Toasts, notifications
```
