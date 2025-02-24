'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function login(username: string, password: string) {
  if (username === 'sta001' && password === 'givemethekeys123') {
    return { success: true }
  }
  return { success: false, error: 'Invalid credentials' }
}

export async function getRentedCars() {
  return await prisma.car.findMany({
    where: {
      status: 'RENTED'
    },
    include: {
      bookings: {
        include: {
          customer: true
        }
      }
    }
  })
}

export async function createBooking(data: any) {
  const basePrice = 25 * data.numberOfDays

  let additionalCosts = 0

  // Car type costs
  switch (data.carType) {
    case 'FAMILY':
      additionalCosts += 50
      break
    case 'SPORTS':
      additionalCosts += 75
      break
    case 'SUV':
      additionalCosts += 65
      break
  }

  // Fuel type costs
  if (data.fuelType === 'HYBRID') {
    additionalCosts += 30
  } else if (data.fuelType === 'ELECTRIC') {
    additionalCosts += 50
  }

  // Optional extras
  if (data.unlimitedMileage) {
    additionalCosts += 10 * data.numberOfDays
  }
  if (data.damageInsurance) {
    additionalCosts += 15 * data.numberOfDays
  }

  const totalPrice = basePrice + additionalCosts

  const customer = await prisma.customer.create({
    data: {
      firstName: data.firstName,
      surname: data.surname,
      address: data.address,
      age: parseInt(data.age),
      drivingLicense: data.drivingLicense,
    },
  })

  const car = await prisma.car.create({
    data: {
      type: data.carType,
      fuel: data.fuelType,
      status: 'RENTED',
    },
  })

  const booking = await prisma.booking.create({
    data: {
      startDate: new Date(),
      numberOfDays: parseInt(data.numberOfDays),
      totalPrice,
      unlimitedMileage: data.unlimitedMileage,
      damageInsurance: data.damageInsurance,
      customerId: customer.id,
      carId: car.id,
      staffId: 'staff-1', // This would normally come from the session
    },
  })

  revalidatePath('/')
  return booking
}