/*
 index.ts - ESP3D WebUI adapter file

 Copyright (c) 2020 Luc Lebosse. All rights reserved.

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

import { httpAdapter as defaultHttpAdapter } from "./httpAdapter"
import type { HttpAdapterParams } from "./httpAdapter"
import { httpAdapter as targetHttpAdapter } from "../targets"

// Targets that don't define their own httpAdapter keep working unchanged.
// Chosen per call, not at module load, so the targets <-> contexts import
// cycle can't leave this bound to an uninitialized import.
const httpAdapter = (url: string, params?: HttpAdapterParams, setUploadProgress?: (percent: number) => void) =>
    (targetHttpAdapter ?? defaultHttpAdapter)(url, params, setUploadProgress)

export { httpAdapter }

// Re-export types
export type { HttpAdapterParams, HttpAdapterReturn } from "./httpAdapter"
