import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { CreateProductDto, UpdateProductDto } from './dto';
import { Product } from './entities/product.entity';
import { isUUID } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger();

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
      const product = this.productRepository.create(createProductDto);
      await this.productRepository.save(product);

      return product;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    return await this.productRepository.find({
      take: limit,
      skip: offset,
    });
  }

  async findOne(term: string) {
    let product: Product;

    if (isUUID(term)) {
      product = await this.productRepository.findOne({ where: { id: term } });
    }

    if (!product) {
      const queryBuilder = this.productRepository.createQueryBuilder();

      product = await queryBuilder
        .where('LOWER(title) =LOWER(:title) or slug =LOWER(:slug)', {
          title: term,
          slug: term,
        })
        .getOne();
    }

    if (!product) {
      throw new NotFoundException(
        `There are no products with identifier that match "${term}"`,
      );
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.productRepository.preload({
      id,
      ...updateProductDto,
    });

    if (!product) {
      throw new NotFoundException(
        `There are no products with identifier that match "${id}"`,
      );
    }

    await this.productRepository.save(product);

    return product;
  }

  async remove(id: string) {
    await this.productRepository.delete(id);

    return `Product with identifier ${id} was deleted successfully!`;
  }

  private handleDBExceptions(error: any): never {
    if (error.code === '23505') {
      throw new BadRequestException(error.detail);
    }

    this.logger.log(error);
    throw new InternalServerErrorException(
      'Unexpected error: check console logs',
    );
  }
}
