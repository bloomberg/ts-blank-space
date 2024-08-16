import { register } from "node:module";
import { pathToFileURL } from "node:url";

register('./hooks.js', pathToFileURL(import.meta.filename));

// Copyright 2024 Bloomberg Finance L.P.
// Distributed under the terms of the Apache 2.0 license.
// https://www.apache.org/licenses/LICENSE-2.0
