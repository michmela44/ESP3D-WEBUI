/* Ambient module declarations for dynamic target alias resolution */

import type { SubTargetModuleExports } from "./SubTargetModule.types"

declare module "SubTargetDir" {
  const exports: SubTargetModuleExports
  export const MachineSettings: SubTargetModuleExports["MachineSettings"]
  export const machineSettings: SubTargetModuleExports["machineSettings"]
  export const defaultPanelsList: SubTargetModuleExports["defaultPanelsList"]
  export const Target: SubTargetModuleExports["Target"]
  export const files: SubTargetModuleExports["files"]
  export const processor: SubTargetModuleExports["processor"]
  export const fwUrl: SubTargetModuleExports["fwUrl"]
  export const Name: SubTargetModuleExports["Name"]
  export const iconsTarget: SubTargetModuleExports["iconsTarget"]
  export const restartdelay: SubTargetModuleExports["restartdelay"]
  export const TargetContextProvider: SubTargetModuleExports["TargetContextProvider"]
  export const useTargetContext: SubTargetModuleExports["useTargetContext"]
  export const useTargetContextFn: SubTargetModuleExports["useTargetContextFn"]
  export const webUIbuild: SubTargetModuleExports["webUIbuild"]
  export const InformationsControls: SubTargetModuleExports["InformationsControls"]
  export const variablesList: SubTargetModuleExports["variablesList"]
  export const eventsList: SubTargetModuleExports["eventsList"]
  export const AppLogo: SubTargetModuleExports["AppLogo"]
  export const WebUILogo: SubTargetModuleExports["WebUILogo"]
  export const QuickButtonsBar: SubTargetModuleExports["QuickButtonsBar"]
  export const BackgroundContainer: SubTargetModuleExports["BackgroundContainer"]
}

declare module "SubTargetDir/*" {
  const value: any
  export default value
}

// Explicit JSON translation patterns for TS resolution
declare module "SubTargetDir/translations/*" {
  const value: Record<string, string>
  export default value
}

declare module "TargetDir" {
  const value: any
  export = value
}

declare module "TargetDir/*" {
  const value: any
  export default value
}

declare module "TargetDir/translations/*" {
  const value: Record<string, string>
  export default value
}

// Some imports use TargetDir/../translations path; declare explicitly
declare module "TargetDir/../translations/*" {
  const value: Record<string, string>
  export default value
}
