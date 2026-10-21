import * as React from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/ui/components/ui/input-group"

// Senha com mostrar/ocultar; a senha só aparece por ação explícita.
function PasswordInput({
  className,
  autoComplete = "current-password",
  ...props
}: Omit<React.ComponentProps<"input">, "type">) {
  const [visible, setVisible] = React.useState(false)

  return (
    <InputGroup data-slot="password-input" className={className}>
      <InputGroupInput autoComplete={autoComplete} spellCheck={false} autoCorrect="off" autoCapitalize="none" {...props} type={visible ? "text" : "password"} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon"
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          disabled={props.disabled}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOffIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}

export { PasswordInput }
