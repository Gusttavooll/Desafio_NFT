import { createRoot } from 'react-dom/client'
import { Button, Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger, PasswordInput, RadioGroup, RadioGroupItem, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/ui/components'
import '@/index.css'
import '@/ui/layout/layout.css'

createRoot(document.getElementById('root')!).render(
  <main className="p-6 grid gap-6">
    <h1>Componentes KRONOS</h1>
    <div><label htmlFor="password">Senha</label><PasswordInput id="password" defaultValue="fixture-password" /></div>
    <Button className="rounded-none min-h-0" data-testid="override">Medidas personalizadas</Button>
    <RadioGroup aria-label="Rede" defaultValue="ethereum">
      <RadioGroupItem value="ethereum">Ethereum <span className="text-muted-foreground">Principal</span></RadioGroupItem>
      <RadioGroupItem value="polygon">Polygon</RadioGroupItem>
    </RadioGroup>
    <Dialog>
      <DialogTrigger asChild><Button variant="outline">Abrir detalhes</Button></DialogTrigger>
      <DialogContent><DialogTitle>Detalhes da obra</DialogTitle><DialogDescription>Dados de demonstração do componente.</DialogDescription></DialogContent>
    </Dialog>
    <Select>
      <SelectTrigger aria-label="Coleção"><SelectValue placeholder="Escolher coleção" /></SelectTrigger>
      <SelectContent><SelectItem value="genesis">Genesis</SelectItem><SelectItem value="archive">Archive</SelectItem></SelectContent>
    </Select>
    <Sheet>
      <SheetTrigger asChild><Button variant="outline">Abrir filtros</Button></SheetTrigger>
      <SheetContent><SheetHeader><SheetTitle>Filtros</SheetTitle><SheetDescription>Refine o acervo.</SheetDescription></SheetHeader></SheetContent>
    </Sheet>
  </main>,
)
