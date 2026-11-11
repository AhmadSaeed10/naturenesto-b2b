"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState, useTransition } from "react";
import { duplicateProduct, saveProduct } from "@/app/actions/admin-products";
import { AdminCard } from "@/components/admin/AdminPage";
import {
  Checkbox,
  OUTLINE_BUTTON,
  SelectInput,
  TEXT_BUTTON,
  TextArea,
  TextInput,
} from "@/components/admin/fields";
import { RichTextEditor } from "@/components/admin/content/RichTextEditor";
import { Button } from "@/components/ui/Button";
import { admin } from "@/content/admin";
import { EMPTY_CARE, type Care } from "@/lib/care";
import { MAX_OPTIONS, type ProductInput, optionCombinations } from "@/lib/admin/product-schema";
import type {
  EditorImage,
  EditorProduct,
  EditorVariant,
  MediaPickerOption,
  PickerOption,
} from "@/lib/admin/products";
import { toHandle } from "@/lib/handle";
import { paisaToRupees, rupeesToPaisa } from "@/lib/money";
import { ImageList } from "./ImageList";

const copy = admin.productEditor;

interface OptionDraft {
  name: string;
  values: string;
}

/** Variant as edited: money as typed rupee text, numbers as text. */
interface VariantDraft {
  key: string;
  id: string | null;
  title: string;
  sku: string;
  price: string;
  compareAt: string;
  cost: string;
  weight: string;
  optionValues: Record<string, string>;
  track: boolean;
  backorder: boolean;
  threshold: string;
  initialStock: string;
  stock: number;
  barcode: string;
  imageId: string;
}

let draftKey = 0;
const nextKey = () => `v${(draftKey += 1)}`;

function toDraft(variant: EditorVariant): VariantDraft {
  return {
    key: variant.id ?? nextKey(),
    id: variant.id,
    title: variant.title,
    sku: variant.sku,
    price: paisaToRupees(variant.price),
    compareAt: paisaToRupees(variant.compare_at_price),
    cost: paisaToRupees(variant.cost),
    weight: variant.weight_g === null ? "" : String(variant.weight_g),
    optionValues: variant.option_values,
    track: variant.track_inventory,
    backorder: variant.allow_backorder,
    threshold: String(variant.low_stock_threshold),
    initialStock: String(variant.initial_stock),
    stock: variant.stock,
    barcode: variant.barcode,
    imageId: variant.image_media_id ?? "",
  };
}

const blankVariant = (
  title: string,
  optionValues: Record<string, string> = {},
  price = "",
): VariantDraft => ({
  key: nextKey(),
  id: null,
  title,
  sku: "",
  price,
  compareAt: "",
  cost: "",
  weight: "",
  optionValues,
  track: true,
  backorder: false,
  threshold: "3",
  initialStock: "0",
  stock: 0,
  barcode: "",
  imageId: "",
});

/** ISO time to the value a datetime-local input expects, in the viewer's time zone. */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const toNumber = (text: string): number | null => {
  const value = Number.parseFloat(text);
  return Number.isFinite(value) && value >= 0 ? value : null;
};

const splitValues = (text: string): string[] => [
  ...new Set(
    text
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
  ),
];
const comboKey = (values: Record<string, string>, names: string[]): string =>
  names.map((name) => values[name] ?? "").join("\u0000");

interface ProductEditorProps {
  product: EditorProduct | null;
  /** Shows the saved message after the post-save reload. */
  justSaved?: boolean;
  manualCollections: PickerOption[];
  categories: PickerOption[];
  media: MediaPickerOption[];
  /** Products that can be picked as related; the id is the product handle. */
  relatedChoices?: PickerOption[];
}

interface SpecDraft {
  key: string;
  label: string;
  value: string;
}

type ErrorKey = keyof typeof copy.errors;

export function ProductEditor({
  product,
  justSaved = false,
  manualCollections,
  categories,
  media,
  relatedChoices = [],
}: ProductEditorProps) {
  const router = useRouter();
  const uid = useId();
  const isNew = product === null;

  const [title, setTitle] = useState(product?.title ?? "");
  const [handle, setHandle] = useState(product?.handle ?? "");
  const [handleTouched, setHandleTouched] = useState(!isNew);
  const [description, setDescription] = useState(product?.description ?? "");
  const [shortDescription, setShortDescription] = useState(product?.short_description ?? "");
  const [specs, setSpecs] = useState<SpecDraft[]>(
    (product?.specs ?? []).map((spec) => ({ key: nextKey(), ...spec })),
  );
  const [included, setIncluded] = useState((product?.included ?? []).join("\n"));
  const [related, setRelated] = useState<string[]>(product?.related_handles ?? []);
  const [relatedQuery, setRelatedQuery] = useState("");
  const [requiresShipping, setRequiresShipping] = useState(product?.requires_shipping ?? true);
  const [dims, setDims] = useState({
    length: String(product?.package_dims?.length ?? ""),
    width: String(product?.package_dims?.width ?? ""),
    height: String(product?.package_dims?.height ?? ""),
  });
  const [publishAt, setPublishAt] = useState(toLocalInput(product?.publish_at));
  const [status, setStatus] = useState<ProductInput["status"]>(product?.status ?? "draft");
  const [vendor, setVendor] = useState(product?.vendor ?? "");
  const [productType, setProductType] = useState(product?.product_type ?? "");
  const [tags, setTags] = useState((product?.tags ?? []).join(", "));
  const [seoTitle, setSeoTitle] = useState(product?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(product?.seo_description ?? "");
  const [care, setCare] = useState<Care>(product?.care ?? EMPTY_CARE);
  const [options, setOptions] = useState<OptionDraft[]>(
    (product?.options ?? []).map((option) => ({
      name: option.name,
      values: option.values.join(", "),
    })),
  );
  const [variants, setVariants] = useState<VariantDraft[]>(
    product ? product.variants.map(toDraft) : [blankVariant(copy.variants.default)],
  );
  const [images, setImages] = useState<EditorImage[]>(product?.images ?? []);
  const [collectionIds, setCollectionIds] = useState<string[]>(product?.collection_ids ?? []);
  const [categoryIds, setCategoryIds] = useState<string[]>(product?.category_ids ?? []);

  const [error, setError] = useState<ErrorKey | null>(null);
  const [badFields, setBadFields] = useState<Set<string>>(new Set());
  const [badVariants, setBadVariants] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState(justSaved);
  const [pending, startTransition] = useTransition();

  const optionList = options
    .map((option) => ({ name: option.name.trim(), values: splitValues(option.values) }))
    .filter((option) => option.name && option.values.length);
  const hasOptions = optionList.length > 0;

  const updateVariant = (key: string, patch: Partial<VariantDraft>) =>
    setVariants((list) =>
      list.map((variant) => (variant.key === key ? { ...variant, ...patch } : variant)),
    );

  /** Rebuilds the variant list from the options, keeping variants whose values still exist. */
  function regenerateVariants() {
    const names = optionList.map((option) => option.name);
    if (!hasOptions) {
      setVariants((list) => [
        list[0] ? { ...list[0], optionValues: {} } : blankVariant(copy.variants.default),
      ]);
      return;
    }
    setVariants((list) => {
      const existing = new Map(
        list.map((variant) => [comboKey(variant.optionValues, names), variant]),
      );
      const price = list[0]?.price ?? "";
      return optionCombinations(optionList).map((combo) => {
        const match = existing.get(comboKey(combo, names));
        const comboTitle = names.map((name) => combo[name]).join(" / ");
        return match
          ? { ...match, title: comboTitle, optionValues: combo }
          : blankVariant(comboTitle, combo, price);
      });
    });
  }

  const toggleIn = (list: string[], id: string): string[] =>
    list.includes(id) ? list.filter((value) => value !== id) : [...list, id];

  function buildInput(): ProductInput | null {
    const invalidVariants = new Set<string>();
    const built = variants.map((variant) => {
      const price = rupeesToPaisa(variant.price);
      const compareAt = variant.compareAt ? rupeesToPaisa(variant.compareAt) : null;
      const cost = variant.cost ? rupeesToPaisa(variant.cost) : null;
      const weight = variant.weight ? Number.parseInt(variant.weight, 10) : null;
      const threshold = Number.parseInt(variant.threshold || "0", 10);
      const initial = Number.parseInt(variant.initialStock || "0", 10);
      if (
        price === null ||
        (variant.compareAt && compareAt === null) ||
        (variant.cost && cost === null) ||
        (weight !== null && Number.isNaN(weight)) ||
        Number.isNaN(threshold) ||
        Number.isNaN(initial) ||
        !variant.title.trim()
      ) {
        invalidVariants.add(variant.key);
      }
      return {
        id: variant.id,
        title: variant.title,
        sku: variant.sku,
        price: price ?? 0,
        compare_at_price: compareAt,
        cost,
        weight_g: weight,
        option_values: hasOptions ? variant.optionValues : {},
        track_inventory: variant.track,
        allow_backorder: variant.backorder,
        low_stock_threshold: threshold,
        initial_stock: variant.id ? 0 : initial,
        barcode: variant.barcode,
        image_media_id: variant.imageId || null,
      };
    });
    setBadVariants(invalidVariants);
    if (invalidVariants.size > 0) {
      setError("variants");
      return null;
    }
    return {
      id: product?.id ?? null,
      title,
      handle,
      description,
      status,
      vendor,
      product_type: productType,
      tags: tags.split(","),
      seo_title: seoTitle,
      seo_description: seoDescription,
      care,
      short_description: shortDescription,
      specs: specs
        .map((spec) => ({ label: spec.label.trim(), value: spec.value.trim() }))
        .filter((spec) => spec.label && spec.value),
      included: included
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      related_handles: related,
      requires_shipping: requiresShipping,
      package_dims: {
        length: toNumber(dims.length),
        width: toNumber(dims.width),
        height: toNumber(dims.height),
      },
      publish_at: publishAt ? new Date(publishAt).toISOString() : "",
      options: optionList,
      variants: built,
      images: images.map((image) => ({ media_id: image.media_id, alt: image.alt })),
      collection_ids: collectionIds,
      category_ids: categoryIds,
    };
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    setError(null);
    setBadFields(new Set());
    const input = buildInput();
    if (!input) return;
    startTransition(async () => {
      const result = await saveProduct(input);
      if (!result.ok) {
        setError(result.error);
        setBadFields(new Set(result.fields ?? []));
        return;
      }
      // Reload from the database so new variants pick up their ids before the next save.
      router.replace(`/admin/products/${result.id}?saved=1`);
      router.refresh();
    });
  }

  function onDuplicate() {
    if (!product?.id) return;
    const id = product.id;
    startTransition(async () => {
      const result = await duplicateProduct(id);
      if (result.ok) router.push(`/admin/products/${result.id}`);
      else setError("failed");
    });
  }

  const fieldError = (name: string, message: string): string | undefined =>
    badFields.has(name) ? message : undefined;
  const statusMessage = error ? copy.errors[error] : saved ? copy.saved : "";

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/products" className={TEXT_BUTTON}>
          {copy.back}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          {!isNew ? (
            <>
              <Link
                href={`/admin/inventory?q=${encodeURIComponent(handle)}`}
                className={OUTLINE_BUTTON}
              >
                {copy.viewInventory}
              </Link>
              <button
                type="button"
                onClick={onDuplicate}
                disabled={pending}
                className={OUTLINE_BUTTON}
              >
                {copy.duplicate}
              </button>
            </>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? copy.saving : copy.save}
          </Button>
        </div>
      </div>
      <p role="status" aria-live="polite" className="min-h-6 text-sm font-medium">
        {statusMessage}
      </p>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <AdminCard title={copy.sections.details}>
            <TextInput
              id={`${uid}-title`}
              label={copy.fields.title}
              value={title}
              required
              error={fieldError("title", copy.errors.title)}
              onChange={(event) => {
                setTitle(event.target.value);
                if (!handleTouched) setHandle(toHandle(event.target.value));
              }}
            />
            <TextInput
              id={`${uid}-handle`}
              label={copy.fields.handle}
              hint={copy.fields.handleHint}
              value={handle}
              required
              error={
                error === "handleTaken"
                  ? copy.errors.handleTaken
                  : fieldError("handle", copy.errors.handle)
              }
              onChange={(event) => {
                setHandleTouched(true);
                setHandle(event.target.value);
              }}
              onBlur={() => setHandle((value) => toHandle(value))}
            />
            <TextArea
              id={`${uid}-short`}
              label={copy.extra.shortDescription}
              hint={copy.extra.shortDescriptionHint}
              value={shortDescription}
              maxLength={300}
              rows={2}
              onChange={(event) => setShortDescription(event.target.value)}
            />
            <RichTextEditor
              id={`${uid}-description`}
              label={copy.fields.description}
              value={description}
              onChange={setDescription}
              rows={10}
            />
            <p className="text-xs text-ink-muted">{copy.fields.descriptionHint}</p>
          </AdminCard>

          <AdminCard title={copy.sections.media} description={copy.media.dragHint}>
            <ImageList images={images} onChange={setImages} media={media} />
          </AdminCard>

          <AdminCard title={copy.sections.options} description={copy.options.intro}>
            {options.map((option, index) => (
              <fieldset
                key={index}
                className="grid grid-cols-1 gap-3 md:grid-cols-[12rem_minmax(0,1fr)_auto] md:items-end"
              >
                <legend className="sr-only">{`${copy.options.name} ${index + 1}`}</legend>
                <TextInput
                  id={`${uid}-option-${index}-name`}
                  label={copy.options.name}
                  value={option.name}
                  onChange={(event) =>
                    setOptions((list) =>
                      list.map((o, i) => (i === index ? { ...o, name: event.target.value } : o)),
                    )
                  }
                />
                <TextInput
                  id={`${uid}-option-${index}-values`}
                  label={copy.options.values}
                  hint={copy.options.valuesHint}
                  value={option.values}
                  onChange={(event) =>
                    setOptions((list) =>
                      list.map((o, i) => (i === index ? { ...o, values: event.target.value } : o)),
                    )
                  }
                />
                <button
                  type="button"
                  className={TEXT_BUTTON}
                  onClick={() => setOptions((list) => list.filter((_, i) => i !== index))}
                >
                  {copy.options.remove}
                </button>
              </fieldset>
            ))}
            <div className="flex flex-wrap gap-3">
              {options.length < MAX_OPTIONS ? (
                <button
                  type="button"
                  className={OUTLINE_BUTTON}
                  onClick={() => setOptions((list) => [...list, { name: "", values: "" }])}
                >
                  {copy.options.add}
                </button>
              ) : null}
              <button type="button" className={OUTLINE_BUTTON} onClick={regenerateVariants}>
                {copy.options.generate}
              </button>
            </div>
          </AdminCard>

          <AdminCard title={copy.sections.variants} description={copy.variants.stockHint}>
            <ul className="flex flex-col gap-4">
              {variants.map((variant) => {
                const id = `${uid}-${variant.key}`;
                return (
                  <li
                    key={variant.key}
                    className={`flex flex-col gap-3 rounded-2xl border p-4 ${badVariants.has(variant.key) ? "border-2 border-ink" : "border-line"}`}
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <TextInput
                        id={`${id}-title`}
                        label={copy.variants.title}
                        value={variant.title}
                        readOnly={hasOptions}
                        className="sm:col-span-2"
                        onChange={(event) =>
                          updateVariant(variant.key, { title: event.target.value })
                        }
                      />
                      <TextInput
                        id={`${id}-sku`}
                        label={copy.variants.sku}
                        value={variant.sku}
                        error={
                          error === "skuTaken" && variant.sku ? copy.errors.skuTaken : undefined
                        }
                        onChange={(event) =>
                          updateVariant(variant.key, { sku: event.target.value })
                        }
                      />
                      <TextInput
                        id={`${id}-price`}
                        label={copy.variants.price}
                        inputMode="decimal"
                        value={variant.price}
                        required
                        onChange={(event) =>
                          updateVariant(variant.key, { price: event.target.value })
                        }
                      />
                      <TextInput
                        id={`${id}-compare`}
                        label={copy.variants.compareAt}
                        inputMode="decimal"
                        value={variant.compareAt}
                        onChange={(event) =>
                          updateVariant(variant.key, { compareAt: event.target.value })
                        }
                      />
                      <TextInput
                        id={`${id}-cost`}
                        label={copy.variants.cost}
                        inputMode="decimal"
                        value={variant.cost}
                        onChange={(event) =>
                          updateVariant(variant.key, { cost: event.target.value })
                        }
                      />
                      <TextInput
                        id={`${id}-weight`}
                        label={copy.variants.weight}
                        inputMode="numeric"
                        value={variant.weight}
                        onChange={(event) =>
                          updateVariant(variant.key, { weight: event.target.value })
                        }
                      />
                      {variant.id ? (
                        <TextInput
                          id={`${id}-stock`}
                          label={copy.variants.stock}
                          value={variant.stock}
                          disabled
                        />
                      ) : (
                        <TextInput
                          id={`${id}-initial`}
                          label={copy.variants.initialStock}
                          inputMode="numeric"
                          value={variant.initialStock}
                          onChange={(event) =>
                            updateVariant(variant.key, { initialStock: event.target.value })
                          }
                        />
                      )}
                      <TextInput
                        id={`${id}-threshold`}
                        label={copy.variants.threshold}
                        inputMode="numeric"
                        value={variant.threshold}
                        onChange={(event) =>
                          updateVariant(variant.key, { threshold: event.target.value })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <TextInput
                        id={`${id}-barcode`}
                        label={copy.extra.barcode}
                        value={variant.barcode}
                        onChange={(event) =>
                          updateVariant(variant.key, { barcode: event.target.value })
                        }
                      />
                      {images.length > 0 ? (
                        <SelectInput
                          id={`${id}-image`}
                          label={copy.extra.variantImage}
                          value={variant.imageId}
                          onChange={(event) =>
                            updateVariant(variant.key, { imageId: event.target.value })
                          }
                        >
                          <option value="">{copy.extra.variantImageNone}</option>
                          {images.map((image, index) => (
                            <option key={image.media_id} value={image.media_id}>
                              {index + 1}. {image.label || image.alt || image.media_id.slice(0, 8)}
                            </option>
                          ))}
                        </SelectInput>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-6">
                      <Checkbox
                        id={`${id}-track`}
                        label={copy.variants.track}
                        checked={variant.track}
                        onChange={(event) =>
                          updateVariant(variant.key, { track: event.target.checked })
                        }
                      />
                      <Checkbox
                        id={`${id}-backorder`}
                        label={copy.variants.backorder}
                        checked={variant.backorder}
                        onChange={(event) =>
                          updateVariant(variant.key, { backorder: event.target.checked })
                        }
                      />
                      {variants.length > 1 ? (
                        <button
                          type="button"
                          className={`${TEXT_BUTTON} ml-auto`}
                          onClick={() =>
                            setVariants((list) => list.filter((v) => v.key !== variant.key))
                          }
                        >
                          {copy.variants.remove}
                          <span className="sr-only">: {variant.title}</span>
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </AdminCard>

          <AdminCard title={copy.sections.specs} description={copy.extra.specsHint}>
            <ul className="flex flex-col gap-3">
              {specs.map((spec) => (
                <li
                  key={spec.key}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
                >
                  <TextInput
                    id={`${uid}-spec-${spec.key}-label`}
                    label={copy.extra.specLabel}
                    value={spec.label}
                    onChange={(event) =>
                      setSpecs((list) =>
                        list.map((row) =>
                          row.key === spec.key ? { ...row, label: event.target.value } : row,
                        ),
                      )
                    }
                  />
                  <TextInput
                    id={`${uid}-spec-${spec.key}-value`}
                    label={copy.extra.specValue}
                    value={spec.value}
                    onChange={(event) =>
                      setSpecs((list) =>
                        list.map((row) =>
                          row.key === spec.key ? { ...row, value: event.target.value } : row,
                        ),
                      )
                    }
                  />
                  <button
                    type="button"
                    className={TEXT_BUTTON}
                    onClick={() => setSpecs((list) => list.filter((row) => row.key !== spec.key))}
                  >
                    {copy.extra.specRemove}
                    <span className="sr-only">: {spec.label}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div>
              <button
                type="button"
                className={OUTLINE_BUTTON}
                onClick={() =>
                  setSpecs((list) => [...list, { key: nextKey(), label: "", value: "" }])
                }
              >
                {copy.extra.specAdd}
              </button>
            </div>
          </AdminCard>

          <AdminCard title={copy.sections.included}>
            <TextArea
              id={`${uid}-included`}
              label={copy.extra.included}
              hint={copy.extra.includedHint}
              value={included}
              rows={4}
              onChange={(event) => setIncluded(event.target.value)}
            />
          </AdminCard>

          <AdminCard title={copy.sections.shipping}>
            <Checkbox
              id={`${uid}-ships`}
              label={copy.extra.requiresShipping}
              checked={requiresShipping}
              onChange={(event) => setRequiresShipping(event.target.checked)}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {(["length", "width", "height"] as const).map((key) => (
                <TextInput
                  key={key}
                  id={`${uid}-dim-${key}`}
                  label={copy.extra[key]}
                  inputMode="decimal"
                  value={dims[key]}
                  onChange={(event) =>
                    setDims((current) => ({ ...current, [key]: event.target.value }))
                  }
                />
              ))}
            </div>
            <p className="text-xs text-ink-muted">{copy.extra.dimsHint}</p>
          </AdminCard>

          <AdminCard title={copy.sections.care}>
            <p className="text-xs text-ink-muted">{copy.care.hint}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {(["light", "water", "pet", "level"] as const).map((key) => (
                <SelectInput
                  key={key}
                  id={`${uid}-care-${key}`}
                  label={copy.care[key]}
                  value={care[key]}
                  onChange={(event) =>
                    setCare((current) => ({ ...current, [key]: event.target.value }))
                  }
                >
                  <option value="">{copy.care.none}</option>
                  {Object.entries(copy.care.options[key]).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </SelectInput>
              ))}
            </div>
            <TextInput
              id={`${uid}-care-size`}
              label={copy.care.size}
              hint={copy.care.sizeHint}
              value={care.size}
              maxLength={80}
              onChange={(event) => setCare((current) => ({ ...current, size: event.target.value }))}
            />
            <TextArea
              id={`${uid}-care-notes`}
              label={copy.care.notes}
              hint={copy.care.notesHint}
              value={care.notes}
              maxLength={1200}
              rows={4}
              onChange={(event) =>
                setCare((current) => ({ ...current, notes: event.target.value }))
              }
            />
          </AdminCard>

          <AdminCard title={copy.sections.seo}>
            <TextInput
              id={`${uid}-seo-title`}
              label={copy.fields.seoTitle}
              value={seoTitle}
              maxLength={70}
              placeholder={title}
              onChange={(event) => setSeoTitle(event.target.value)}
            />
            <TextArea
              id={`${uid}-seo-description`}
              label={copy.fields.seoDescription}
              value={seoDescription}
              maxLength={170}
              rows={3}
              onChange={(event) => setSeoDescription(event.target.value)}
            />
          </AdminCard>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <AdminCard title={copy.sections.status}>
            <SelectInput
              id={`${uid}-status`}
              label={copy.sections.status}
              value={status}
              onChange={(event) => setStatus(event.target.value as ProductInput["status"])}
            >
              {(["active", "draft", "archived"] as const).map((key) => (
                <option key={key} value={key}>
                  {admin.status[key]}
                </option>
              ))}
            </SelectInput>
            <TextInput
              id={`${uid}-publish`}
              label={copy.extra.publishAt}
              hint={copy.extra.publishHint}
              type="datetime-local"
              value={publishAt}
              onChange={(event) => setPublishAt(event.target.value)}
            />
          </AdminCard>

          <AdminCard title={copy.sections.related} description={copy.extra.relatedHint}>
            <TextInput
              id={`${uid}-related-q`}
              label={copy.extra.relatedSearch}
              value={relatedQuery}
              onChange={(event) => setRelatedQuery(event.target.value)}
            />
            <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
              {relatedChoices
                .filter(
                  (choice) =>
                    choice.id !== handle &&
                    (related.includes(choice.id) ||
                      choice.label.toLowerCase().includes(relatedQuery.trim().toLowerCase())),
                )
                .slice(0, 60)
                .map((choice) => (
                  <Checkbox
                    key={choice.id}
                    id={`${uid}-related-${choice.id}`}
                    label={choice.label}
                    checked={related.includes(choice.id)}
                    onChange={() => setRelated((list) => toggleIn(list, choice.id))}
                  />
                ))}
            </div>
          </AdminCard>

          <AdminCard title={copy.sections.organisation}>
            <TextInput
              id={`${uid}-type`}
              label={copy.fields.productType}
              value={productType}
              onChange={(event) => setProductType(event.target.value)}
            />
            <TextInput
              id={`${uid}-vendor`}
              label={copy.fields.vendor}
              value={vendor}
              onChange={(event) => setVendor(event.target.value)}
            />
            <TextInput
              id={`${uid}-tags`}
              label={copy.fields.tags}
              hint={copy.fields.tagsHint}
              value={tags}
              onChange={(event) => setTags(event.target.value)}
            />
            <fieldset className="flex flex-col gap-1">
              <legend className="mb-1 text-sm font-medium">{copy.fields.collections}</legend>
              <p className="text-xs text-ink-muted">{copy.fields.automatic}</p>
              {manualCollections.map((collection) => (
                <Checkbox
                  key={collection.id}
                  id={`${uid}-collection-${collection.id}`}
                  label={collection.label}
                  checked={collectionIds.includes(collection.id)}
                  onChange={() => setCollectionIds((list) => toggleIn(list, collection.id))}
                />
              ))}
            </fieldset>
            <fieldset className="flex flex-col gap-1">
              <legend className="mb-1 text-sm font-medium">{copy.fields.categories}</legend>
              {categories.length === 0 ? (
                <p className="text-xs text-ink-muted">{copy.fields.noCategories}</p>
              ) : (
                categories.map((category) => (
                  <Checkbox
                    key={category.id}
                    id={`${uid}-category-${category.id}`}
                    label={category.label}
                    checked={categoryIds.includes(category.id)}
                    onChange={() => setCategoryIds((list) => toggleIn(list, category.id))}
                  />
                ))
              )}
            </fieldset>
          </AdminCard>
        </div>
      </div>
    </form>
  );
}
