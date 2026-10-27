import { PercentPipe, TitleCasePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AdminProduct } from '../../core/models';
import { AdminActions } from '../../store/admin.actions';
import { adminFeature } from '../../store/admin.feature';
import {
  selectCatalogEntities,
  selectCategories,
  selectUnitCosts,
} from '../../store/catalog.selectors';
import { ProductsActions } from '../../store/products.actions';
import { productsFeature } from '../../store/products.feature';

const IMAGE_PATTERN = /^(https?:\/\/\S+|data:image\/[a-z+]+;base64,\S+)$/i;
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_IMAGE_SIDE = 600;

@Component({
  selector: 'app-product-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PercentPipe,
    TitleCasePipe,
    MatAutocompleteModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
})
export class ProductForm {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  /** Absent on /admin/products/new. */
  readonly id = input<string>();

  protected readonly status = this.store.selectSignal(productsFeature.selectStatus);
  private readonly entities = this.store.selectSignal(selectCatalogEntities);
  private readonly ownProducts = this.store.selectSignal(adminFeature.selectProducts);
  private readonly costs = this.store.selectSignal(selectUnitCosts);
  protected readonly categories = this.store.selectSignal(selectCategories);

  protected readonly isNew = computed(() => !this.id());
  protected readonly product = computed(() => {
    const id = Number(this.id());
    return id ? this.entities()[id] : undefined;
  });
  protected readonly own = computed(() =>
    this.ownProducts().find((p) => p.id === Number(this.id())),
  );
  /** API products are read-only apart from their cost. */
  protected readonly costOnly = computed(() => !this.isNew() && !this.own());
  protected readonly notFound = computed(
    () =>
      !this.isNew() && !this.product() && this.status() !== 'loading' && this.status() !== 'idle',
  );

  protected readonly form = inject(NonNullableFormBuilder).group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    price: [0, [Validators.required, Validators.min(0.01), Validators.max(100000)]],
    cost: [0, [Validators.required, Validators.min(0), Validators.max(100000)]],
    category: ['', [Validators.required, Validators.maxLength(40)]],
    description: ['', [Validators.required, Validators.maxLength(2000)]],
    image: ['', [Validators.required, Validators.pattern(IMAGE_PATTERN)]],
  });

  private readonly value = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  protected readonly margin = computed(() => {
    const { price = 0, cost = 0 } = this.value();
    return price > 0 ? (price - cost) / price : null;
  });
  protected readonly imagePreview = computed(() => {
    const image = this.value().image ?? '';
    return IMAGE_PATTERN.test(image) ? image : null;
  });
  protected readonly filteredCategories = computed(() => {
    const typed = (this.value().category ?? '').toLowerCase();
    return this.categories().filter((c) => c.includes(typed));
  });

  protected readonly uploadError = signal<string | null>(null);
  private filled = false;

  constructor() {
    this.store.dispatch(ProductsActions.loadProducts());

    // Fill the form once the product is available (API products arrive asynchronously).
    effect(() => {
      const product = this.product();
      if (!product || this.filled) return;
      this.filled = true;
      untracked(() => {
        this.form.setValue({
          title: product.title,
          price: product.price,
          cost: this.costs()[product.id] ?? 0,
          category: product.category,
          description: product.description,
          image: product.image,
        });
        if (this.costOnly()) {
          for (const [name, control] of Object.entries(this.form.controls)) {
            if (name !== 'cost') control.disable();
          }
        }
      });
    });
  }

  protected async onFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.uploadError.set(null);
    if (!file.type.startsWith('image/')) {
      this.uploadError.set('Choose an image file (JPG, PNG, WebP or GIF).');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      this.uploadError.set('That image is larger than 8 MB.');
      return;
    }
    try {
      const control = this.form.controls.image;
      control.setValue(await resizeImage(file));
      control.markAsTouched();
    } catch {
      this.uploadError.set("That image couldn't be read. Try another file.");
    }
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();

    if (this.costOnly()) {
      const product = this.product()!;
      this.store.dispatch(AdminActions.setProductCost({ productId: product.id, cost: value.cost }));
      this.done(`Saved the cost of ${product.title.slice(0, 40)}`);
      return;
    }

    const existing = this.own();
    const product: AdminProduct = {
      id: existing?.id ?? nextId(this.ownProducts()),
      title: value.title.trim(),
      price: round2(value.price),
      cost: round2(value.cost),
      category: value.category.trim().toLowerCase(),
      description: value.description.trim(),
      image: value.image.trim(),
      rating: existing?.rating ?? { rate: 0, count: 0 },
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    this.store.dispatch(AdminActions.saveProduct({ product }));
    this.done(existing ? 'Product updated' : 'Product added. It is now live in the shop.');
  }

  private done(message: string): void {
    this.snackBar.open(message, 'OK', { duration: 4000 });
    this.router.navigate(['/admin/products']);
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Own products start at 1001 so they never collide with the API's ids (1-20). */
function nextId(products: readonly AdminProduct[]): number {
  return Math.max(1000, ...products.map((p) => p.id)) + 1;
}

/**
 * Shrinks an uploaded image to fit within 600px and re-encodes it as JPEG,
 * so it stays small enough to keep in localStorage.
 */
async function resizeImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d')!;
  // JPEG has no transparency; paint white first so transparent PNGs don't turn black.
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.82);
}
