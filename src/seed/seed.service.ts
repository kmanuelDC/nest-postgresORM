import { Injectable } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';
import { initialData } from './data/seed-data';
import { Product } from 'src/products/entities';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';


@Injectable()
export class SeedService {

  constructor(
    private readonly productsService: ProductsService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }


  async execute() {

    await this.deleteTables();
    const firstUser = await this.insertNewUsers();
    await this.insertNewProducts(firstUser);
    return 'SEED EXECUTED';
  }

  private async deleteTables() {
    await this.productsService.deleteAllProducts();
    const queryBuilder = this.userRepository.createQueryBuilder();
    await queryBuilder.delete().where({}).execute();


  }

  private async insertNewUsers() {
    const users = initialData.users;
    const promisesToInsert: User[] = [];

    users.forEach(user => {
      promisesToInsert.push(this.userRepository.create(
        {
          ...user,
          password: bcrypt.hashSync(user.password, 10),
        }
      ));
    });
    const dbUser = await this.userRepository.save(promisesToInsert);
    return dbUser[0];
  }


  private async insertNewProducts(user: User) {
    await this.productsService.deleteAllProducts();
    const products = initialData.products;
    const promisesToInsert: Promise<Product | undefined>[] = [];

    products.forEach(product => {
      promisesToInsert.push(this.productsService.create(product, user));
    });

    await Promise.all(promisesToInsert);

  }

}
