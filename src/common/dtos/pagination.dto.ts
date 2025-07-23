import { Type } from "class-transformer";
import { IsOptional, IsPositive, Min } from "class-validator";




export class PaginationDto {

    @IsOptional()
    @Type(() => Number)
    @Min(0)
    public offset?: number;

    @IsOptional()
    @IsPositive()
    @Type(() => Number)
    public limit?: number;
}