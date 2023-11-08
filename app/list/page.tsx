'use client'
import { Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@nextui-org/react";

import React, { useState, useEffect, useMemo } from "react";

type ApiResponse = {
    id: number;
  fullName: string;
  email: string;
  dynamic: DynamicObject[];
};

type DynamicObject = {
  question: string;
  answer: string;
};

type DynamicColumn = {
  key: string;
  label: string;
  value: string;
};

async function getList(): Promise<ApiResponse[]> {
  const res = await fetch(
    "https://api.mockfly.dev/mocks/b5e57dcb-49d7-497f-a65f-090a225a60ef/list"
  );
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  const data: ApiResponse[] = await res.json();
  return data;
}

function removeDuplicates(dynamics: DynamicColumn[]): DynamicColumn[] {
  const uniqueCol = new Map<string, DynamicColumn>();
  for (const dynamic of dynamics) {
    if (!uniqueCol.has(dynamic.key)) {
      uniqueCol.set(dynamic.key, dynamic);
    }
  }
  return Array.from(uniqueCol.values());
}

function createDynamicColumns(dynamicArray: ApiResponse[]): DynamicColumn[] {
    return dynamicArray.flatMap((apiResponse) =>
      apiResponse.dynamic.map((item) => {
        const key = item.question
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^\w\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .toLowerCase();
  
        return {
          key: key,
          label: item.question,
          value: item.answer,
        };
      })
    );
  }
  

export default function ListPage() {
  const [items, setItems] = useState<ApiResponse[]>([]);
  const [dynamicColumns, setDynamicColumns] = useState<DynamicColumn[]>([]);

  useEffect(() => { 
    getList()
      .then((response: ApiResponse[]) => {
        if (response) {
          setItems(response);
          console.log(items);
          const dynamicColumns = createDynamicColumns(response);
          removeDuplicates(dynamicColumns);
          setDynamicColumns(removeDuplicates(dynamicColumns));
        }
      })
      .catch((error) => {
        console.error("Error fetching the list:", error);
      });
  }, []);

  // Combine static and dynamic columns into a single array
  const columns = React.useMemo(() => {
    const staticColumns = [
      { key: "fullName", label: "FullName" },
      { key: "email", label: "email" },
    ];
    return [...staticColumns, ...dynamicColumns];
  }, [dynamicColumns]);

// render the table
const renderCell = React.useCallback(
    (rowValue: ApiResponse, columnKey: React.Key, dynamicColumns: DynamicColumn[]) => {
      switch (columnKey) {
        case "fullName":
          return rowValue.fullName;
        case "email":
          return rowValue.email;
        default: 
        const column = dynamicColumns.find((dc) => dc.key === columnKey);
        if(column)
            return column?.value;
          return "N/A";
      }
    },
    []
  );

  return (
    <Table aria-label="Example static collection table">
    <TableHeader columns={columns}>
      {(column) => (
        <TableColumn
          key={column.key}
          {...(column.key === "name" ? { allowsSorting: true } : {})}
        >
          {column.label}
        </TableColumn>
      )}
    </TableHeader>
    <TableBody 
      items={items}
      loadingContent={<Spinner />}
    >
      {(item) => (
        <TableRow key={item.id}>
          {(columnKey) => ( 
            <TableCell>{renderCell(item, columnKey, dynamicColumns)}</TableCell>
          )}
        </TableRow>
      )}
    </TableBody>
  </Table>
  );
}
