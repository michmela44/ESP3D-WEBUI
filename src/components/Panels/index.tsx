import { ComponentChildren, TargetedMouseEvent } from "preact"
import { ChevronDown } from "preact-feather"
import { useUiContextFn } from "../../contexts"

interface MenuItem {
    divider?: boolean
    label?: ComponentChildren
    icon?: ComponentChildren
    onClick?: (e: TargetedMouseEvent<HTMLElement>) => void
    displayToggle?: () => ComponentChildren
    disabled?: boolean
}

const Menu = ({ items }: { items: MenuItem[] }) => {
    return (
        <div
            class="dropdown dropdown-right"
            onClick={(e) => {
                useUiContextFn.haptic()
            }}
        >
            <span
                class="dropdown-toggle btn btn-xs btn-header m-1"
                tabIndex={0}
            >
                <ChevronDown style={{ width: "0.8rem", height: "0.8rem" }} />
            </span>
            <ul class="menu">
                {items &&
                    items.map((item, i) => {
                        if (item.divider) {
                            return <li class="divider" key={i}></li>
                        }
                        return (
                            <li class={`menu-item ${item.disabled ? "disabled" : ""}`} key={i}>
                                <div
                                    className="menu-entry"
                                    onClick={item.disabled ? undefined : item.onClick}
                                    style={item.disabled ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
                                >
                                    <div class="menu-panel-item">
                                        <span class="text-menu-item">
                                            {item.label}
                                        </span>
                                        {item.displayToggle
                                            ? item.displayToggle()
                                            : item.icon}
                                    </div>
                                </div>
                            </li>
                        )
                    })}
            </ul>
        </div>
    )
}

export default { Menu }
export { Menu }
