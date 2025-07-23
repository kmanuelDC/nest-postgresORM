import { Injectable } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';
import { initialData } from './data/seed-data';
import { Product } from 'src/products/entities';


@Injectable()
export class SeedService {

  constructor(
    private readonly productsService: ProductsService,
  ) { }


  async execute() {
    await this.insertNewProducts();
    return 'Seed Executed';
  }

  private async insertNewProducts() {
    //return 'Products inserted';
    await this.productsService.deleteAllProducts();
    const products = initialData.products;

    const promisesToInsert: Promise<Product | undefined>[] = [];

    products.forEach(product => {
      promisesToInsert.push(this.productsService.create(product));
    });

    await Promise.all(promisesToInsert);

  }

}
