import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

const ordersRef = collection(db, "orders");

export async function addOrder(order) {
  const orderNumber = Number(order.orderNumber);

  const q = query(ordersRef, where("orderNumber", "==", orderNumber));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    // Берём первую запись — она останется
    const mainDoc = snapshot.docs[0];
    const existingQuantity = Number(mainDoc.data().quantity) || 0;
    const addQuantity = Number(order.quantity) || 0;

    // Обновляем главную запись
    await updateDoc(doc(db, "orders", mainDoc.id), {
      quantity: existingQuantity + addQuantity,
      status: order.status,
      package: order.package,
      updatedAt: new Date()
    });

    // Удаляем все дубли если есть
    for (let i = 1; i < snapshot.docs.length; i++) {
      await deleteDoc(doc(db, "orders", snapshot.docs[i].id));
    }

  } else {
    await addDoc(ordersRef, {
      orderNumber: orderNumber,
      package: order.package,
      status: order.status,
      quantity: Number(order.quantity) || 0,
      createdAt: new Date()
    });
  }
}

export async function getOrder(code) {
  const q = query(ordersRef, where("orderNumber", "==", Number(code)));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    throw new Error("Not found");
  }
  return snapshot.docs[0].data();
}

export async function getTotalQuantity() {
  const snapshot = await getDocs(ordersRef);
  let total = 0;
  snapshot.docs.forEach(d => {
    total += Number(d.data().quantity) || 0;
  });
  return total;
}

export async function getLastUpdated() {
  const snapshot = await getDocs(ordersRef);
  let lastDate = null;
  snapshot.docs.forEach(d => {
    const data = d.data();
    const updated = data.updatedAt?.toDate?.();
    const created = data.createdAt?.toDate?.();
    const date = updated || created;
    if (date && (!lastDate || date > lastDate)) {
      lastDate = date;
    }
  });
  return lastDate;
}

export async function shipOrder(orderNumber, shipQuantity) {
  const q = query(ordersRef, where("orderNumber", "==", Number(orderNumber)));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error("Заказ не найден");
  }

  const existingDoc = snapshot.docs[0];
  const existingQuantity = Number(existingDoc.data().quantity) || 0;
  const newQuantity = Math.max(0, existingQuantity - Number(shipQuantity));

  await updateDoc(doc(db, "orders", existingDoc.id), {
    quantity: newQuantity,
    updatedAt: new Date()
  });

  return newQuantity;
}