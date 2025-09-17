import { FoodSourceSystem } from '../../simulation/FoodSourceSystem';

describe('FoodSourceSystem', () => {
  let foodSystem: FoodSourceSystem;
  
  beforeEach(() => {
    foodSystem = new FoodSourceSystem();
  });
  
  test('getCollectionRateForType returns correct values', () => {
    // Test private method via a test-accessible wrapper or integration test
    expect(foodSystem['getCollectionRateForType']('nectar')).toBe(5.0);
    expect(foodSystem['getCollectionRateForType']('fruit')).toBe(3.0);
    // Add more assertions for other types
  });
  
  test('clearAll removes all food sources', () => {
    // Add food sources
    // Call clearAll
    // Verify sources were removed
  });
});