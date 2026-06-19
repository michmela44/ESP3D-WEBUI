import { FunctionalComponent } from "preact"
import { useSettingsContext, useUiContextFn } from "../../../contexts"
import { byteMastersBase64 } from "./logoData"; // Fallback Base64 si aucune image custom

interface LogoProps {
  height?: string
  color?: string
  bgcolor?: string
}

/*
 * Logo ByteMasters + support logo utilisateur (preferences.json -> custom_logo)
 * Priorite : SVG inline custom (interfaceSettings.custom.logo)
 *          > Image uploadee par l'utilisateur (custom_logo, base64 data-URL)
 *          > Logo ByteMasters par defaut
 * default height is 30px
 */
const AppLogo: FunctionalComponent<LogoProps> = ({
  height = "30px",
  color = "#20262C",
  bgcolor = "white",
}) => {
  const { interfaceSettings } = useSettingsContext() as any
  const userLogo = useUiContextFn.getValue("custom_logo")

  if (
    interfaceSettings.current &&
    interfaceSettings.custom &&
    interfaceSettings.custom.logo
  )
    return (
      <span
        dangerouslySetInnerHTML={{
          __html: interfaceSettings.custom.logo
            .replace("{height}", height)
            .replaceAll("{color}", color)
            .replaceAll("{bgcolor}", bgcolor),
        }}
      ></span>
    )

  if (userLogo)
    return (
      <img
        src={userLogo}
        alt="Custom Logo"
        style={{ height: height, width: "auto", display: "block" }}
      />
    )

  return (
    <img 
      src={byteMastersBase64} 
      alt="ByteMasters Logo" 
      style={{ height: height, width: "auto", display: "block" }} 
    />
  )
}

export { AppLogo }

