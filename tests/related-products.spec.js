const { test, expect } = require('@playwright/test');
const { ProductPage } = require('../pages/ProductPage');

test.describe('eBay Related Products Functional Suite', () => {
    let productPage;

    test.beforeEach(async ({ page, context }) => {
        const mainPage = new ProductPage(page);
        await mainPage.navigateAndClearPopup();

        const pagePromise = context.waitForEvent('page');
        await mainPage.searchAndSelectProduct('wallet');

        const newTab = await pagePromise;
        await newTab.waitForLoadState();

        productPage = new ProductPage(newTab);
        await productPage.loadRelatedSection();
    });

    test('TC_01: Verify related section visibility', async () => {
        await expect(productPage.relatedSection.first()).toBeVisible();
    });

    test('TC_02: Verify "Similar items" display more than 6 products if available', async () => {
        const count = await productPage.getRelatedProductCount();

        console.log(`Found ${count} items inside 'Similar items'`);

        if (count >= 6) {
            console.log(`Requirement satisfied: ${count} items displayed`);
        } else {
            console.log(`Less than 6 similar items available: ${count}`);
        }

        expect(count).toBeGreaterThan(0);
    });

    test('TC_03: Check category relevance', async () => {
        const titles = await productPage.productTitles.allInnerTexts();
        for (const title of titles) {
            expect(title.toLowerCase()).toMatch(/wallet|wallets|leather/);
        }
    });

    test('TC_04: Validate unrelated categories are not displayed', async () => {
        const titles = await productPage.productTitles.allInnerTexts();

        const unrelatedItems = [];

        for (const title of titles) {
            const lowerTitle = title.toLowerCase();

            if (/shoes|watch/.test(lowerTitle)) {
                unrelatedItems.push(title);
            }
        }

        if (unrelatedItems.length > 0) {
            console.log(`Unrelated items found: ${unrelatedItems.join(', ')}`);
        }

        expect(unrelatedItems.length).toBe(0);
    });

    test('TC_05: Validate similar items are not duplicated', async () => {
        const titles = await productPage.productTitles.allInnerTexts();

        const seenItems = new Set();
        const duplicateItems = [];

        for (const title of titles) {
            const normalizedTitle = title.trim().toLowerCase();

            if (seenItems.has(normalizedTitle)) {
                duplicateItems.push(title);
            } else {
                seenItems.add(normalizedTitle);
            }
        }

        if (duplicateItems.length > 0) {
            console.log(`Duplicate items found: ${duplicateItems.join(', ')}`);
        }

        expect(duplicateItems.length).toBe(0);
    });

    test('TC_06: Validate price range consistency', async () => {
        const mainPrice = await productPage.getMainProductPrice();
        const prices = await productPage.productPrices.allInnerTexts();

        const minPrice = mainPrice - 20;
        const maxPrice = mainPrice + 20;

        console.log(`Main Product Price: $${mainPrice}`);
        console.log(`Expected Price Range: $${minPrice} - $${maxPrice}`);

        for (const priceText of prices) {
            const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));

            if (price < minPrice || price > maxPrice) {
                console.log(`Out of range price found: $${price}`);
            }

            expect.soft(price).toBeGreaterThanOrEqual(minPrice);
            expect.soft(price).toBeLessThanOrEqual(maxPrice);
        }
    });

    test('TC_07: Validate products outside allowed price range', async ({ page }) => {
        const mainPrice = await productPage.getMainProductPrice();
        const prices = await productPage.productPrices.allInnerTexts();

        const minPrice = mainPrice - 20;
        const maxPrice = mainPrice + 20;

        const failedPrices = [];

        console.log(`Main Product Price: $${mainPrice}`);
        console.log(`Expected Range: $${minPrice} - $${maxPrice}`);

        for (const priceText of prices) {
            const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));

            if (price < minPrice || price > maxPrice) {
                failedPrices.push(price);
            }
        }

        if (failedPrices.length > 0) {
            console.log(`Prices outside allowed range: ${failedPrices.join(', ')}`);
        }

        expect(failedPrices.length).toBe(0);
    });
});