require('dotenv').config();
const { connectSQL } = require('./config/dbSQL');
const Product = require('./models/Products');

const productos = [
    {
        nombre: 'Corbatero mega argolla',
        descripcion: 'Collar corbatero de gamuza, color personalizable, con un mega dije de argolla y detalles plateados en los cierres.',
        precio: 5000,
        stock: 4,
        categoria: 'collar',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1779838561/WhatsApp_Image_2026-05-24_at_10.34.53_PM_gyp8is.jpg'
    },
    {
        nombre: 'Pulsera medallita de la Virgen',
        descripcion: 'Pulsera de cristales rosas, perlas blancas y una medallita de la Virgen. Elástica.',
        precio: 2000,
        stock: 10,
        categoria: 'pulsera',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1779840639/WhatsApp_Image_2026-05-26_at_9.08.36_PM_2_knzxor.jpg'
    },
    {
        nombre: 'Gargantilla corazones',
        descripcion: 'Cadena o gargantilla de corazones en dorado.',
        precio: 3000,
        stock: 3,
        categoria: 'collar',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1779840639/WhatsApp_Image_2026-05-26_at_9.08.36_PM_1_tcrtmj.jpg'
    },
    {
        nombre: 'Pulsera de hilo con iniciales',
        descripcion: 'Pulseras de hilo encerado, con iniciales a elección y corazón rojo. Regulables.',
        precio: 2000,
        stock: 50,
        categoria: 'pulsera',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1779840639/WhatsApp_Image_2026-05-26_at_9.08.36_PM_3_nlcert.jpg'
    },
    {
        nombre: 'Collar Ángel',
        descripcion: 'Collar o gargantilla doble de perlas y cadena, con doble dije de Hello Kitty y ángel.',
        precio: 5000,
        stock: 3,
        categoria: 'collar',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1779840639/WhatsApp_Image_2026-05-02_at_2.17.35_PM_c0fzyt.jpg'
    },
    {
        nombre: 'Pulsera estrella',
        descripcion: 'Pulsera con perlas negras, blancas y grises, con cierre mosquetón y dije de estrella pequeña.',
        precio: 1800,
        stock: 8,
        categoria: 'pulsera',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1779840640/WhatsApp_Image_2026-05-02_at_2.17.45_PM_dv2zcn.jpg'
    },
    {
        nombre: 'Gargantilla cadena multidije',
        descripcion: 'Collar o gargantilla de cadena ancha de niquel, con dijes de estrellas y colgantes de cadena fina de niquel.',
        precio: 3500,
        stock: 10,
        categoria: 'collar',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1779840640/WhatsApp_Image_2026-05-24_at_10.34.56_PM_zemjkc.jpg'
    },
    {
        nombre: 'Aros Gota',
        descripcion: 'Aros colgantes, con dije argolla y dije gota plateada, con base de acero quirúrgico.',
        precio: 2200,
        stock: 1,
        categoria: 'aro',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1779840639/WhatsApp_Image_2026-05-26_at_9.08.35_PM_ernkwe.jpg'
    },
    {
        nombre: 'Aros flor perladas',
        descripcion: 'Aros pasantes con micro perlas en forma de flor.',
        precio: 1800,
        stock: 20,
        categoria: 'aro',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1779840639/WhatsApp_Image_2026-05-26_at_9.08.36_PM_eeoce7.jpg'
    }
];

const seed = async () => {
    await connectSQL();
    await Product.bulkCreate(productos, { ignoreDuplicates: true });
    console.log('✅ Productos cargados con éxito');
    process.exit(0);
};

seed();