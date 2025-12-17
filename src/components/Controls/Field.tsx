/*
Field.tsx - ESP3D WebUI component file

 Copyright (c) 2021 Alexandre Aussourd. All rights reserved.
 Modified by Luc LEBOSSE 2021

 This code is free software; you can redistribute it and/or
 modify it under the terms of the GNU Lesser General Public
 License as published by the Free Software Foundation; either
 version 2.1 of the License, or (at your option) any later version.
 This code is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 Lesser General Public License for more details.
 You should have received a copy of the GNU Lesser General Public
 License along with This code; if not, write to the Free Software
 Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

import { Fragment,  FunctionalComponent } from "preact"
import {
    FormGroup,
    Input,
    Select,
    Boolean,
    PickUp,
    ItemsList,
    IconSelect,
    LabelCtrl,
    Slider,
    Mask,
} from "./Fields"

interface FieldProps {
    type?: string
    id?: string
    help?: string
    [key: string]: any
}

const Field: FunctionalComponent<FieldProps> = (props) => {
    const { type, id, help } = props
    switch (type) {
        case "mask":
        case "xmask":
            return (
                <div>
                    <Mask {...props as any} />
                    <FormGroup {...props as any}></FormGroup>
                </div>
            )
        case "label":
            return (
                <FormGroup {...props as any}>
                    <LabelCtrl {...props as any} />
                </FormGroup>
            )
        case "list":
            return (
                <Fragment>
                    <ItemsList {...props as any} />
                    <FormGroup {...props as any} />
                </Fragment>
            )
        case "pickup":
            return (
                <FormGroup {...props as any}>
                    <PickUp {...props as any} />
                </FormGroup>
            )
        case "icon":
            return (
                <FormGroup {...props as any}>
                    <IconSelect {...props as any} />
                </FormGroup>
            )
        case "select":
            return (
                <FormGroup {...props as any}>
                    <Select {...props as any} />
                </FormGroup>
            )
        case "slider":
            return (
                <FormGroup {...props as any}>
                    <Slider {...props as any} />
                </FormGroup>
            )
        case "boolean":
            return (
                <FormGroup {...props as any}>
                    <Boolean {...props as any} />
                </FormGroup>
            )
        default:
            //input
            return (
                <FormGroup {...props as any}>
                    <Input {...props as any} />
                </FormGroup>
            )
    }
}
export { Field }
