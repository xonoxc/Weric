import { Option } from "effect"
const t = Option.getOrElse(Option.some("x"), () => "")
const s: string = t
