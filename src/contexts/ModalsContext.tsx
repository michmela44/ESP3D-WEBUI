import { createContext, FunctionalComponent, ComponentChildren } from "preact"
import { useContext, useState, useCallback, useMemo } from "preact/hooks"
import { generateUID, disableUI } from "../components/Helpers"

// Type definitions
interface Modal {
    id?: string
    [key: string]: any
}

interface ModalsContextValue {
    modals: {
        modalList: Modal[]
        addModal: (modal: Modal) => void
        removeModal: (index: number) => void
        getModalIndex: (id: string) => number
        clearModals: () => void
    }
}

interface ModalsContextProviderProps {
    children: ComponentChildren
}

const ModalsContext = createContext<ModalsContextValue | undefined>(undefined)
const useModalsContext = () => {
    const context = useContext(ModalsContext)
    if (!context) {
        throw new Error("useModalsContext must be used within a ModalsContextProvider")
    }
    return context
}

const ModalsContextProvider: FunctionalComponent<ModalsContextProviderProps> = ({ children }) => {
    const [modals, setModal] = useState<Modal[]>([])

    const addModal = useCallback(
        (newModal: Modal) =>
            setModal((prev) => [...prev, { ...newModal, id: newModal.id ? newModal.id : generateUID() }]),
        []
    )

    const getModalIndex = useCallback(
        (id: string): number => {
            return modals.findIndex((element) => element.id == id)
        },
        [modals]
    )

    const removeModal = useCallback(
        (modalIndex: number) => {
            const newModalList = modals.filter((modal, index) => index !== modalIndex)
            setModal(newModalList)
            if (newModalList.length == 0) disableUI(false)
        },
        [modals]
    )

    const clearModals = useCallback(() => {
        setModal([])
    }, [])

    const store: ModalsContextValue = useMemo(
        () => ({
            modals: {
                modalList: modals,
                addModal,
                removeModal,
                getModalIndex,
                clearModals,
            },
        }),
        [modals, addModal, removeModal, getModalIndex, clearModals]
    )

    return <ModalsContext.Provider value={store}>{children}</ModalsContext.Provider>
}

export { ModalsContextProvider, useModalsContext }
export type { ModalsContextValue, Modal }
