import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { isUUID } from 'class-validator';
import { ProductImage } from './entities';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');


  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource,
  ) { }


  async create(createProductDto: CreateProductDto) {
    try {

      const { images = [], ...productDetailsProps } = createProductDto;

      const product = this.productRepository.create({
        ...productDetailsProps,
        images: images.map(image => this.productImageRepository.create({ url: image }))
      });
      await this.productRepository.save(product);

      return product;

    } catch (error) {
      this.handleDBException(error);
    }
  }

  //TODO - add pagination
  async findAll(paginationDto: PaginationDto) {

    const { limit = 10, offset = 0 } = paginationDto;
    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true
      }
      //TODO - add relations
    });

    return products.map(product => ({
      ...product,
      images: product.images.map(img => img.url)
    }));
  }

  async findOne(term: string): Promise<Product> {
    let product: Product | null;

    if (isUUID(term)) {
      product = await this.productRepository.findOne({ where: { id: term } })
    } else {
      const queryBuilder = this.productRepository.createQueryBuilder('prod');
      product = await queryBuilder
        .where('LOWER(prod.title) = LOWER(:slug) OR LOWER(prod.slug) = LOWER(:slug)', {
          slug: term,
          title: term
        })
        .leftJoinAndSelect('prod.images', 'img')
        .getOne();
    }
    if (!product) {
      throw new InternalServerErrorException(`Product with ${term} not found`);
    }

    return product;
  }

  async findOnePlain(term: string) {
    const { images = [], ...product } = await this.findOne(term);
    return {
      ...product,
      images: images.map(img => img.url)
    };
  }


  async update(id: string, updateProductDto: UpdateProductDto) {
    const { images, ...toUpdate } = updateProductDto;
    const slug = null;

    const product = await this.productRepository.preload({ id, ...toUpdate })

    if (!product) { throw new InternalServerErrorException(`Product with id ${id} not found`); }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (images) {
        await queryRunner.manager.delete(ProductImage, { product: { id } });

        product.images = images.map(image => this.productImageRepository.create({ url: image }));
      }
      await queryRunner.manager.save(Product, product);
      await queryRunner.commitTransaction();
      await queryRunner.release();
      return this.findOnePlain(id);

    } catch (error) {

      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      this.handleDBException(error);
    }


  }

  async remove(id: string) {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
    return { message: `${product.title} was deleted` };

  }

  async deleteAllProducts() {
    const query = this.productRepository.createQueryBuilder('prod');

    try {
      return await query
        .delete()
        .where({})
        .execute();
    } catch (error) {
      this.handleDBException(error);
    }
  }

  private handleDBException(error: any) {
    this.logger.error(error);
    throw new InternalServerErrorException('Database error');
  }
}
