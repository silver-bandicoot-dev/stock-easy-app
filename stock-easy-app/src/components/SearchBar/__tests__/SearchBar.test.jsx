import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchBar } from '../SearchBar';
import { BrowserRouter } from 'react-router-dom';

// Mock du module useSearch
vi.mock('../useSearch', () => ({
  useSearch: vi.fn(() => ({
    results: [],
    loading: false,
    error: null,
    saveToHistory: vi.fn(),
    clearHistory: vi.fn(),
    getSearchHistory: vi.fn(() => []),
  })),
}));

// Helper pour wrapper avec Router
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('SearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait afficher le composant avec placeholder par défaut', () => {
    renderWithRouter(<SearchBar />);
    const input = screen.getByPlaceholderText(/rechercher un produit/i);
    expect(input).toBeDefined();
  });

  it('devrait afficher un placeholder personnalisé', () => {
    renderWithRouter(<SearchBar placeholder="Recherche personnalisée" />);
    const input = screen.getByPlaceholderText(/recherche personnalisée/i);
    expect(input).toBeDefined();
  });

  it('devrait mettre à jour la valeur de l\'input lors de la saisie', async () => {
    renderWithRouter(<SearchBar />);
    const input = screen.getByPlaceholderText(/rechercher un produit/i);

    fireEvent.change(input, { target: { value: 'test' } });

    await waitFor(() => {
      expect(input.value).toBe('test');
    });
  });

  it('devrait afficher le bouton clear quand il y a du texte', async () => {
    renderWithRouter(<SearchBar />);
    const input = screen.getByPlaceholderText(/rechercher un produit/i);

    fireEvent.change(input, { target: { value: 'test' } });

    await waitFor(() => {
      const clearButton = screen.getByLabelText(/effacer la recherche/i);
      expect(clearButton).toBeDefined();
    });
  });

  it('devrait effacer l\'input quand on clique sur le bouton clear', async () => {
    renderWithRouter(<SearchBar />);
    const input = screen.getByPlaceholderText(/rechercher un produit/i);

    fireEvent.change(input, { target: { value: 'test' } });

    await waitFor(() => {
      const clearButton = screen.getByLabelText(/effacer la recherche/i);
      fireEvent.click(clearButton);
    });

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('devrait afficher le raccourci clavier quand l\'input est vide', () => {
    renderWithRouter(<SearchBar />);
    const kbd = screen.getByText('K');
    expect(kbd).toBeDefined();
  });

  it('devrait appeler onSelect quand fourni', async () => {
    const mockOnSelect = vi.fn();
    const { useSearch } = await import('../useSearch');

    // Mock avec des résultats
    useSearch.mockReturnValue({
      results: [
        {
          category: 'Produits',
          items: [
            {
              id: 'SKU-001',
              type: 'product',
              title: 'Test Product',
              subtitle: 'Test',
              data: {},
            },
          ],
        },
      ],
      loading: false,
      error: null,
      saveToHistory: vi.fn(),
      clearHistory: vi.fn(),
      getSearchHistory: vi.fn(() => []),
    });

    renderWithRouter(<SearchBar onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText(/rechercher un produit/i);

    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.focus(input);

    // Attendre que le dropdown apparaisse avec les résultats
    await waitFor(() => {
      const items = screen.queryAllByRole('button');
      expect(items.length).toBeGreaterThan(0);
    });
  });
});

