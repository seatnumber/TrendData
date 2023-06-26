export const config: Config = {
    processPath : __dirname+'/../',
    version: 1.1,
    mongohost:process.env.mongohost ? process.env.mongohost : '',
    database:process.env.database ? process.env.database : ''
}

export class Config {
    processPath: string = '';
    version: number = 0;
    mongohost: string = '';
    database: string = '';
    
}
