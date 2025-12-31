import { z } from 'zod'

export const serviceSchema = z.object({
  name: z.string().min(2, 'Tjänstens namn måste vara minst 2 tecken'),
  price: z.number().min(1, 'Pris måste vara minst 1 kr'),
  duration: z.number().optional(),
  category: z.string().optional(),
})

export const companySchema = z.object({
  name: z.string().min(2, 'Företagsnamn måste vara minst 2 tecken').max(100, 'Företagsnamn får max vara 100 tecken'),
  category: z.string().min(1, 'Välj en kategori'),
  city: z.string().min(2, 'Stad måste vara minst 2 tecken'),
  address: z.string().optional(),
  description: z.string().max(2000, 'Beskrivning får max vara 2000 tecken').optional(),
  phone: z.string().regex(/^[\d\s\+\-\(\)]+$/, 'Ogiltigt telefonnummer').optional().or(z.literal('')),
  email: z.string().email('Ogiltig e-postadress').optional().or(z.literal('')),
  website: z.string().url('Ogiltig webbadress').optional().or(z.literal('')),
  services: z.array(serviceSchema).min(1, 'Lägg till minst en tjänst'),
  openingHours: z
    .record(
      z.string(),
      z.object({
        open: z.string(),
        close: z.string(),
        closed: z.boolean(),
      })
    )
    .optional(),
})

export type CompanyFormData = z.infer<typeof companySchema>
export type ServiceFormData = z.infer<typeof serviceSchema>
