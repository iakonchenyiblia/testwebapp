'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { servicesApi, categoriesApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll().then((res) => res.data),
  });

  const { data: popularServices } = useQuery({
    queryKey: ['services', { sort: 'popular', limit: 6 }],
    queryFn: () => servicesApi.getAll({ sort: 'popular', limit: 6 }).then((res) => res.data),
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center py-16 md:py-24">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
          Book Professional Services<br />in Minutes
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
          Find and book the best services in your area. From beauty salons to fitness trainers, 
          we have everything you need.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/services">
            <Button size="lg" variant="primary">Browse Services</Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline">Become a Provider</Button>
          </Link>
        </div>
      </section>

      {/* Categories Section */}
      {categories && categories.length > 0 && (
        <section className="py-12">
          <h2 className="text-2xl font-bold mb-6">Popular Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((category: any) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group p-4 rounded-xl border hover:border-primary-500 hover:shadow-md transition-all duration-200 text-center"
              >
                <div className="text-3xl mb-2">{category.icon || '📁'}</div>
                <h3 className="font-medium group-hover:text-primary-500 transition-colors">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Popular Services Section */}
      {popularServices && popularServices.services && popularServices.services.length > 0 && (
        <section className="py-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Popular Services</h2>
            <Link href="/services">
              <Button variant="ghost" size="sm">View All →</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularServices.services.map((service: any) => (
              <Link
                key={service.id}
                href={`/services/${service.slug}`}
                className="group rounded-xl border overflow-hidden hover:shadow-lg transition-all duration-200"
              >
                <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative">
                  {service.imageUrl ? (
                    <img
                      src={service.imageUrl}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-1 group-hover:text-primary-500 transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                    {service.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">${Number(service.price).toFixed(2)}</span>
                    {service.rating > 0 && (
                      <span className="text-sm text-yellow-500">★ {service.rating.toFixed(1)}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800/50 rounded-2xl mt-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="font-semibold mb-2">Easy Search</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Find the perfect service with our advanced filters and search options.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="font-semibold mb-2">Instant Booking</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Book appointments in real-time with instant confirmation.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-4">💳</div>
            <h3 className="font-semibold mb-2">Secure Payment</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Pay securely online with our encrypted payment system.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
