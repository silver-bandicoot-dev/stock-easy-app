import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { act } from 'react';
import { MappingSKUFournisseur } from '../MappingSKUFournisseur';

describe('MappingSKUFournisseur', () => {
  const suppliers = {
    Supplier1: {
      name: 'Supplier1',
      email: 'supplier1@example.com',
      leadTimeDays: 7,
      moq: 25
    },
    Supplier2: {
      name: 'Supplier2',
      email: 'supplier2@example.com',
      leadTimeDays: 5,
      moq: 10
    }
  };

  const products = [
    { sku: 'SKU1', name: 'Produit 1', stock: 100, supplier: 'Supplier1' },
    { sku: 'SKU2', name: 'Produit 2', stock: 50, supplier: null },
    { sku: 'SKU3', name: 'Produit 3', stock: 75, supplier: 'Supplier1' }
  ];

  const setup = (overrideProps = {}) => {
    const onSaveSupplierMapping = vi.fn().mockResolvedValue({});
    const utils = render(
      <MappingSKUFournisseur
        products={products}
        suppliers={suppliers}
        onSaveSupplierMapping={onSaveSupplierMapping}
        {...overrideProps}
      />
    );

    return {
      ...utils,
      onSaveSupplierMapping
    };
  };

  it('affiche le titre, la description et les statistiques', () => {
    setup();

    expect(
      screen.getByText('🔗 Mapping Produits ↔ Fournisseurs')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Organisez vos catalogues à grande échelle/i)
    ).toBeInTheDocument();

    const totalCard = screen.getByText('Total produits').parentElement;
    const assignedCard = screen.getByText('Assignés').parentElement;
    const pendingCard = screen.getByText('À assigner').parentElement;

    expect(totalCard).toHaveTextContent('3');
    expect(assignedCard).toHaveTextContent('2');
    expect(pendingCard).toHaveTextContent('1');
  });

  it('liste les fournisseurs et sélectionne le premier par défaut', () => {
    setup();

    const selectedSupplier = screen.getByText('supplier1@example.com').closest('button');
    expect(selectedSupplier).toHaveClass('bg-neutral-900 text-white');
    expect(
      screen.getByText(/Produits attribués à Supplier1/i)
    ).toBeInTheDocument();
  });

  it('affiche les produits assignés et disponibles de manière distincte', () => {
    setup();

    const assignedList = screen.getByTestId('assigned-products-list');
    const availableList = screen.getByTestId('available-products-list');

    expect(within(assignedList).getByText(/SKU1/)).toBeInTheDocument();
    expect(within(assignedList).getByText(/SKU3/)).toBeInTheDocument();
    expect(within(availableList).getByText(/SKU2/)).toBeInTheDocument();
  });

  it('permet d’assigner un produit via le bouton d’action', () => {
    setup();

    const availableList = screen.getByTestId('available-products-list');
    const availableItem = within(availableList).getByText(/SKU2/).closest('li');
    const assignButton = within(availableItem).getByRole('button', { name: /Assigner/i });
    fireEvent.click(assignButton);

    const assignedList = screen.getByTestId('assigned-products-list');
    expect(within(assignedList).getByText(/SKU2/)).toBeInTheDocument();
  });

  it('permet de retirer un produit via le bouton d’action', () => {
    setup();

    const [, assignedList] = screen.getAllByRole('list');
    const assignedItem = within(assignedList).getByText(/SKU1/).closest('li');
    const removeButton = within(assignedItem).getByRole('button', { name: /Retirer/i });
    fireEvent.click(removeButton);

    const refreshedAvailableList = screen.getByTestId('available-products-list');
    expect(within(refreshedAvailableList).getByText(/SKU1/)).toBeInTheDocument();
  });

  it('appelle la sauvegarde avec la liste des SKU assignés', async () => {
    const { onSaveSupplierMapping } = setup();

    const availableList = screen.getByTestId('available-products-list');
    const availableItem = within(availableList).getByText(/SKU2/).closest('li');
    const assignButton = within(availableItem).getByRole('button', { name: /Assigner/i });
    await act(async () => {
      fireEvent.click(assignButton);
    });

    const saveButton = screen.getByRole('button', { name: /^Sauvegarder$/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(onSaveSupplierMapping).toHaveBeenCalledTimes(1);
    const [supplierName, assignedSkus] = onSaveSupplierMapping.mock.calls[0];
    expect(supplierName).toBe('Supplier1');
    expect(new Set(assignedSkus)).toEqual(new Set(['SKU1', 'SKU2', 'SKU3']));
  });

  it('réinitialise les modifications via le bouton réinitialiser', () => {
    setup();

    const assignedList = screen.getByTestId('assigned-products-list');
    const assignedItem = within(assignedList).getByText(/SKU1/).closest('li');
    const removeButton = within(assignedItem).getByRole('button', { name: /Retirer/i });
    fireEvent.click(removeButton);

    const resetButton = screen.getByRole('button', { name: /^Réinitialiser$/i });
    fireEvent.click(resetButton);

    const refreshedAssignedList = screen.getByTestId('assigned-products-list');
    expect(within(refreshedAssignedList).getByText(/SKU1/)).toBeInTheDocument();
  });

  it('filtre les produits des deux listes avec la recherche', () => {
    setup();

    const searchInput = screen.getByPlaceholderText(/Rechercher un produit/i);
    fireEvent.change(searchInput, { target: { value: 'SKU2' } });

    expect(screen.queryByText('SKU1')).not.toBeInTheDocument();
    expect(screen.getByText('SKU2')).toBeInTheDocument();
  });
});

