import { AdminCard } from "@/components/admin/AdminPage";
import {
  AddZoneForm,
  PaymentMethodForm,
  TaxForm,
  ZoneForm,
} from "@/components/admin/settings/CommerceForms";
import { admin } from "@/content/admin";
import { ACCESS, requireStaff } from "@/lib/auth/staff";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { paymentMethods, shippingRates, shippingZones, taxSettings } from "@/lib/db/schema";

const copy = admin.settings.commerce;

export default async function CommerceSettingsPage() {
  await requireStaff(ACCESS.storeSettings);
  const [zones, rates, [tax], methods] = await Promise.all([
    db().select().from(shippingZones).orderBy(asc(shippingZones.position)),
    db().select().from(shippingRates).orderBy(asc(shippingRates.createdAt)),
    db().select().from(taxSettings).limit(1),
    db().select().from(paymentMethods).orderBy(asc(paymentMethods.position)),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-ink-muted">{copy.intro}</p>
      <AdminCard title={copy.zones.title} description={copy.zones.intro}>
        {zones.map((zone) => {
          // The admin edits one rate per zone (the oldest); extra rates only come from direct imports.
          const rate = rates.find((r) => r.zoneId === zone.id);
          return (
            <ZoneForm
              key={`${zone.id}-${rate?.id ?? "none"}`}
              zone={{
                id: zone.id,
                name: zone.name,
                cities: zone.cities,
                isDefault: zone.isDefault,
                rate: rate
                  ? {
                      id: rate.id,
                      price: rate.price,
                      freeOver: rate.freeOver,
                      active: rate.active,
                    }
                  : null,
              }}
            />
          );
        })}
      </AdminCard>
      <AdminCard title={copy.zones.add}>
        <AddZoneForm />
      </AdminCard>
      {tax ? (
        <AdminCard title={copy.tax.title}>
          <TaxForm
            tax={{ label: tax.label, rateBps: tax.rateBps, included: tax.pricesIncludeTax }}
          />
        </AdminCard>
      ) : null}
      <AdminCard title={copy.payments.title} description={copy.payments.intro}>
        {methods.map((method) => (
          <PaymentMethodForm key={method.id} method={method} />
        ))}
      </AdminCard>
    </div>
  );
}
