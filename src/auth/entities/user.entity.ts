import { isArray } from "class-validator";
import { Product } from "src/products/entities";
import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
export class User {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text', {
        unique: true
    })
    email: string;

    @Column('text')
    password: string;

    @Column('text')
    fullName: string;

    @Column('bool', {
        default: true
    })
    isActive: boolean;

    @Column({
        type: 'text',
        array: true,
        default: ['user']
    })
    roles: string[];

    @OneToMany(
         () => Product,
         (product) => product.user
        // (user) => user.id, {
        // cascade: true,
        // eager: true
    )
    product : Product;


    @BeforeInsert()
    @BeforeUpdate()
    checkEmailToInsert() {
        this.email = this.email.toLowerCase().trim();
    }
}
