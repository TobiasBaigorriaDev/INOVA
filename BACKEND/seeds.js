require('dotenv').config();
const { connectSQL } = require('./config/dbSQL');
const Product = require('./models/Products');

const productos = [
    {
        nombre: 'Corbatero mega argolla',
        descripcion: 'Collar corbatero de gamuza, color personalizable, con un mega dije de argolla y detalles plateados en los cierres.',
        precio: 5000, stock: 4, categoria: 'collar',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1779838561/WhatsApp_Image_2026-05-24_at_10.34.53_PM_gyp8is.jpg'
    },
    {
        nombre: 'Pulsera medallita de la Virgen',
        descripcion: 'Pulsera de cristales rosas, perlas blancas y una medallita de la Virgen. Elástica.',
        precio: 2000, stock: 10, categoria: 'pulsera',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1779840639/WhatsApp_Image_2026-05-26_at_9.08.36_PM_2_knzxor.jpg'
    },
    {
        nombre: 'Gargantilla corazones',
        descripcion: 'Cadena o gargantilla de corazones en dorado.',
        precio: 3000, stock: 3, categoria: 'collar',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1779840639/WhatsApp_Image_2026-05-26_at_9.08.36_PM_1_tcrtmj.jpg'
    },
    {
        nombre: 'Pulsera de hilo con iniciales',
        descripcion: 'Pulseras de hilo encerado, con iniciales a elección y corazón rojo. Regulables.',
        precio: 2000, stock: 50, categoria: 'pulsera',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1779840639/WhatsApp_Image_2026-05-26_at_9.08.36_PM_3_nlcert.jpg'
    },
    {
        nombre: 'Collar Ángel',
        descripcion: 'Collar o gargantilla doble de perlas y cadena, con doble dije de Hello Kitty y ángel.',
        precio: 5000, stock: 3, categoria: 'collar',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1779840639/WhatsApp_Image_2026-05-02_at_2.17.35_PM_c0fzyt.jpg'
    },
    {
        nombre: 'Pulsera estrella',
        descripcion: 'Pulsera con perlas negras, blancas y grises, con cierre mosquetón y dije de estrella pequeña.',
        precio: 1800, stock: 8, categoria: 'pulsera',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1779840640/WhatsApp_Image_2026-05-02_at_2.17.45_PM_dv2zcn.jpg'
    },
    {
        nombre: 'Gargantilla cadena multidije',
        descripcion: 'Collar o gargantilla de cadena ancha de niquel, con dijes de estrellas y colgantes de cadena fina de niquel.',
        precio: 3500, stock: 10, categoria: 'collar',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1779840640/WhatsApp_Image_2026-05-24_at_10.34.56_PM_zemjkc.jpg'
    },
    {
        nombre: 'Aros Gota',
        descripcion: 'Aros colgantes, con dije argolla y dije gota plateada, con base de acero quirúrgico.',
        precio: 2200, stock: 1, categoria: 'aro',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1779840639/WhatsApp_Image_2026-05-26_at_9.08.35_PM_ernkwe.jpg'
    },
    {
        nombre: 'Aros flor perladas',
        descripcion: 'Aros pasantes con micro perlas en forma de flor.',
        precio: 1800, stock: 20, categoria: 'aro',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1779840639/WhatsApp_Image_2026-05-26_at_9.08.36_PM_eeoce7.jpg'
    },
    {
        nombre: 'Llavero "El Principito"',
        descripcion: 'Llavero temático del principito.',
        precio: 2000, stock: 10, categoria: 'pendiente',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1781143330/WhatsApp_Image_2026-06-10_at_10.58.44_PM_jzyuuy.jpg'
    },
    {
        nombre: 'Gargantilla margaritas',
        descripcion: 'Gargantilla o collar de margaritas de mostacillones y perlas grandes.',
        precio: 4000, stock: 20, categoria: 'collar',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1781143330/WhatsApp_Image_2026-06-10_at_10.58.43_PM_g8ekjy.jpg'
    },
    {
        nombre: 'Cinturones',
        descripcion: 'Cintos con distintas formas y dijes, regulables o hechos a medida. Disponibles en dorado: estrellas y círculos. Disponibles en plateado: estrellas, círculos, corazones.',
        precio: 7500, stock: 50, categoria: 'pendiente',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1781143330/WhatsApp_Image_2026-06-10_at_10.58.45_PM_3_zzwotn.jpg'
    },
    {
        nombre: 'Corbatero mega espiral',
        descripcion: 'Collar de gamuza con dije de mega espiral. Color del collar a elección.',
        precio: 5000, stock: 4, categoria: 'collar',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1781143330/WhatsApp_Image_2026-06-10_at_10.58.43_PM_1_vjjqzo.jpg'
    },
    {
        nombre: 'Collares "siempre con vos"',
        descripcion: 'Collar de corazón para regalar. Disponible en dorado y plateado.',
        precio: 2000, stock: 30, categoria: 'collar',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1781143330/WhatsApp_Image_2026-06-10_at_10.58.45_PM_2_anrihw.jpg'
    },
    {
        nombre: 'Corbatero Arena',
        descripcion: 'Corbatero con mega dije de estrella y estrellas pequeñas en las puntas. Color a elección del collar.',
        precio: 5000, stock: 2, categoria: 'collar',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1781143331/WhatsApp_Image_2026-06-10_at_10.58.45_PM_quhudg.jpg'
    },
    {
        nombre: 'Portachupetes',
        descripcion: 'Portachupetes personalizados con nombre y colores a elección.',
        precio: 5000, stock: 42, categoria: 'pendiente',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1781143331/WhatsApp_Image_2026-06-10_at_10.58.44_PM_3_yuzcsx.jpg'
    },
    {
        nombre: 'Gargantilla caracoles',
        descripcion: 'Gargantilla o collar corto de caracoles colgandos de hilo beige.',
        precio: 5000, stock: 15, categoria: 'collar',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1781143331/WhatsApp_Image_2026-06-10_at_10.58.44_PM_4_vmginy.jpg'
    },
    {
        nombre: 'Gargantilla soles',
        descripcion: 'Gargantilla corta de dijes de sol en dorado. Regulable.',
        precio: 3500, stock: 3, categoria: 'collar',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1781143332/WhatsApp_Image_2026-06-10_at_10.58.46_PM_1_q48z9u.jpg'
    },
    {
        nombre: 'Aros Nova',
        descripcion: 'Aros de corazón perlado y estrellas.',
        precio: 2000, stock: 40, categoria: 'aro',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1781143332/WhatsApp_Image_2026-06-10_at_10.58.43_PM_2_u3djzv.jpg'
    },
    {
        nombre: 'Pulseras para compartir',
        descripcion: 'Pulseras con corazón y perlas negras de tanza.',
        precio: 3200, stock: 30, categoria: 'pulsera',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1781143332/WhatsApp_Image_2026-06-10_at_10.58.44_PM_2_gqjlu7.jpg'
    },
    {
        nombre: 'Llavero moño',
        descripcion: 'Colgante de moño de perlas grandes, color a elección.',
        precio: 2800, stock: 25, categoria: 'pendiente',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1781143332/WhatsApp_Image_2026-06-10_at_10.58.44_PM_1_xjvhqu.jpg'
    },
    {
        nombre: 'Pulseras sol, luna y estrella',
        descripcion: 'Pulseras de perlas negras de 3 para compartir.',
        precio: 5000, stock: 12, categoria: 'pulsera',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1781143332/WhatsApp_Image_2026-06-10_at_10.58.45_PM_4_aickkq.jpg'
    },
    {
        nombre: 'Gargantilla love chain',
        descripcion: 'Gargantilla o collar corto de corazones pasantes.',
        precio: 2500, stock: 10, categoria: 'collar',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1781143332/WhatsApp_Image_2026-06-10_at_10.58.46_PM_fa8vfu.jpg'
    },
    {
        nombre: 'Pulsera protección',
        descripcion: 'Pulseras de flores y ojo turco, disponibles en azul y roja. Con mosquetón de cierre.',
        precio: 2500, stock: 18, categoria: 'pulsera',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1781145435/WhatsApp_Image_2026-06-10_at_11.36.15_PM_usdlqu.jpg'
    },
    {
        nombre: 'Pulseras/tobilleras anchas',
        descripcion: 'Pulseras o tobilleras en par anchas para compartir blancas y negras.',
        precio: 3500, stock: 60, categoria: 'pulsera',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1781145435/WhatsApp_Image_2026-06-10_at_11.32.31_PM_3_bt08uy.jpg'
    },
    {
        nombre: 'Collar doble estrellas',
        descripcion: 'Gargantilla y collar doble con estrellas perladas.',
        precio: 4000, stock: 10, categoria: 'collar',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1781145435/WhatsApp_Image_2026-06-10_at_11.32.31_PM_1_zhkqlp.jpg'
    },
    {
        nombre: 'Pulseras equipos',
        descripcion: 'Pulseras para compartir de equipos de futbol con dije de botín.',
        precio: 2000, stock: 20, categoria: 'pulsera',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1781145435/WhatsApp_Image_2026-06-10_at_11.32.31_PM_4_pbphee.jpg'
    },
    {
        nombre: 'Aros triple corazón',
        descripcion: 'Aros colgantes con triple corazón. Disponible: blancos, negros, rojos, rosas, lilas.',
        precio: 2200, stock: 15, categoria: 'aro',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1781145435/WhatsApp_Image_2026-06-10_at_11.32.31_PM_szwaxj.jpg'
    },
    {
        nombre: 'Collar Shrek',
        descripcion: 'Collar temático de Shrek con dedicatoria.',
        precio: 2000, stock: 35, categoria: 'collar',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1781145436/WhatsApp_Image_2026-06-10_at_11.32.31_PM_2_xn6wtm.jpg'
    },
    {
        nombre: 'Pulsera Argentina',
        descripcion: 'Pulsera de Argentina con dije de pelota.',
        precio: 1300, stock: 11, categoria: 'pulsera',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1781145436/WhatsApp_Image_2026-06-10_at_11.36.15_PM_3_vul2oz.jpg'
    },
    {
        nombre: 'Collar Coraline',
        descripcion: 'Collar temático de Coraline.',
        precio: 2000, stock: 4, categoria: 'collar',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1781145436/WhatsApp_Image_2026-06-10_at_11.36.15_PM_2_gogmzi.jpg'
    },
    {
        nombre: 'Gargantilla Hearthbeat',
        descripcion: 'Gargantilla con muchos corazones, disponible solo en plateada.',
        precio: 4000, stock: 24, categoria: 'collar',
        imagenUrl: 'https://res.cloudinary.com/dmqmoorem/image/upload/v1781145436/WhatsApp_Image_2026-06-10_at_11.36.15_PM_1_pxa3fc.jpg'
    }
];

const seed = async () => {
    await connectSQL();
    await Product.destroy({ where: {}, truncate: true, cascade: true });
    await Product.bulkCreate(productos);
    console.log(`✅ ${productos.length} productos cargados con éxito`);
    process.exit(0);
};

seed();