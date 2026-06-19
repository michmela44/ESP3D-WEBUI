/*
 ImageUpload.tsx - ESP3D WebUI component file
 Custom field type "image" : lets user pick a local image file,
 converts it to a base64 data-URL and stores it as the field value
 (consumed later as <img src={value} />, e.g. for a custom logo).

 This code is free software; you can redistribute it and/or
 modify it under the terms of the GNU Lesser General Public
 License as published by the Free Software Foundation; either
 version 2.1 of the License, or (at your option) any later version.
*/

import { FunctionalComponent, TargetedEvent } from "preact"
import { useRef, useState, useEffect } from "preact/hooks"
import { Upload, XCircle } from "preact-feather"
import { T } from "./../../Translations"

interface ImageUploadProps {
    id?: string
    value?: string
    setValue?: (value: string, update?: boolean) => void
    maxSizeKb?: number
    [key: string]: any
}

const ImageUpload: FunctionalComponent<ImageUploadProps> = (props) => {
    const { id, value, setValue, maxSizeKb = 80 } = props
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [preview, setPreview] = useState<string>(value || "")
    const [error, setError] = useState<string>("")

    useEffect(() => {
        setPreview(value || "")
    }, [value])

    const handleFile = (e: TargetedEvent<HTMLInputElement, Event>) => {
        const file = e.currentTarget.files && e.currentTarget.files[0]
        setError("")
        if (!file) return

        if (!file.type.startsWith("image/")) {
            setError(T("S5") /* generic invalid value fallback */)
            return
        }

        if (maxSizeKb && file.size > maxSizeKb * 1024) {
            setError(`${T("CN115")} (${maxSizeKb}KB)`)
            return
        }

        const reader = new FileReader()
        reader.onload = () => {
            const result = reader.result as string
            setPreview(result)
            if (setValue) setValue(result)
        }
        reader.readAsDataURL(file)
    }

    const handleClear = () => {
        setPreview("")
        if (setValue) setValue("")
        if (inputRef.current) inputRef.current.value = ""
    }

    return (
        <div className="d-flex flex-column" style={{ gap: "0.4rem" }}>
            <div className="d-flex" style={{ alignItems: "center", gap: "0.6rem" }}>
                <label
                    className="btn btn-sm"
                    style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                >
                    <Upload size={16} />
                    {T("S63") /* "Browse" / generic action label fallback */}
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        style={{ display: "none" }}
                        onChange={handleFile}
                        id={id}
                    />
                </label>
                {preview && (
                    <button
                        type="button"
                        className="btn btn-sm btn-clear-action"
                        onClick={handleClear}
                        title={T("S64") /* "Delete" fallback */}
                    >
                        <XCircle size={16} />
                    </button>
                )}
            </div>

            {preview && (
                <div
                    style={{
                        padding: "0.4rem",
                        border: "1px solid var(--panel-header-bg, #ddd)",
                        borderRadius: "4px",
                        display: "inline-block",
                        background: "var(--panel-bg, #fff)",
                        width: "fit-content",
                    }}
                >
                    <img
                        src={preview}
                        alt="logo preview"
                        style={{ height: "40px", width: "auto", display: "block" }}
                    />
                </div>
            )}

            {error && (
                <span className="text-error" style={{ fontSize: "0.75rem" }}>
                    {error}
                </span>
            )}
        </div>
    )
}

export default ImageUpload
