/* Ambient module declarations for CNC/FluidNC direct imports */

// JSON, SCSS, CSS imports - use any for compatibility with original webpack alias behavior
declare module "*.json" {
  const value: any
  export default value
}

declare module "*.scss" {
  const value: any
  export default value
}

declare module "*.css" {
  const value: any
  export default value
}
