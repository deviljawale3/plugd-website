import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('https://plugd.onrender.com/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      // Set sample products if API fails
      setProducts([
        { _id: '1', name: 'Sample Product 1', price: 29.99, description: 'Great product!', image: '/placeholder.jpg' },
        { _id: '2', name: 'Sample Product 2', price: 49.99, description: 'Amazing quality!', image: '/placeholder.jpg' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Plugd - Premium eCommerce Store</title>
        <meta name="description" content="Discover amazing products at Plugd" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container">
        <header className="header">
          <h1>🔌 PLUGD</h1>
          <p>Premium eCommerce Experience</p>
        </header>

        <main className="main">
          <section className="hero">
            <h2>Welcome to Plugd Store</h2>
            <p>Discover amazing products with unbeatable quality</p>
          </section>

          <section className="products">
            <h3>Featured Products</h3>
            {loading ? (
              <p>Loading products...</p>
            ) : (
              <div className="product-grid">
                {products.map((product) => (
                  <div key={product._id} className="product-card">
                    <img src={product.image || '/placeholder.jpg'} alt={product.name} />
                    <h4>{product.name}</h4>
                    <p>{product.description}</p>
                    <div className="price">${product.price}</div>
                    <button className="add-to-cart">Add to Cart</button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>

        <footer className="footer">
          <p>&copy; 2025 Plugd. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
}
