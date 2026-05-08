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