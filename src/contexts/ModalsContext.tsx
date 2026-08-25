import { createContext, FunctionalComponent, ComponentChildren } from "preact"
import { useContext, useState, useRef, useCallback, useMemo } from "preact/hooks"
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
    //Callbacks stored in a modal (or captured by an async request) outlive the
    //render they were created in, so the modal list must be read from a ref and
    //not from the state snapshot that closure captured, otherwise looking a
    //modal up by id returns -1 and it can never be removed.
    const modalsRef = useRef<Modal[]>(modals)

    const applyModals = useCallback((newModalList: Modal[]) => {
        modalsRef.current = newModalList
        setModal(newModalList)
    }, [])

    const addModal = useCallback(
        (newModal: Modal) => {
            applyModals([
                ...modalsRef.current,
                { ...newModal, id: newModal.id ? newModal.id : generateUID() },
            ])
        },
        [applyModals]
    )

    const getModalIndex = useCallback((id: string): number => {
        return modalsRef.current.findIndex((element) => element.id == id)
    }, [])

    const removeModal = useCallback(
        (modalIndex: number) => {
            //nothing to remove, do not touch the list
            if (modalIndex < 0 || modalIndex >= modalsRef.current.length) return
            const newModalList = modalsRef.current.filter((modal, index) => index !== modalIndex)
            applyModals(newModalList)
            if (newModalList.length == 0) disableUI(false)
        },
        [applyModals]
    )

    const clearModals = useCallback(() => {
        applyModals([])
        disableUI(false)
    }, [applyModals])

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
