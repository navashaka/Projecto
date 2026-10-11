import type {
  InventoryFieldDefinition,
  InventoryResourceDefinition,
  InventoryResourceKey,
} from '../types/inventoryTypes'

const text = (
  name: string,
  label: string,
  maxLength: number,
  required = false,
): InventoryFieldDefinition => ({
  name,
  label,
  kind: 'text',
  maxLength,
  required,
})

const longText = (
  name: string,
  label: string,
  maxLength: number,
): InventoryFieldDefinition => ({
  name,
  label,
  kind: 'textarea',
  maxLength,
})

const number = (
  name: string,
  label: string,
  options: Pick<
    InventoryFieldDefinition,
    'required' | 'step' | 'defaultValue'
  > = {},
): InventoryFieldDefinition => ({
  name,
  label,
  kind: 'number',
  ...options,
})

const date = (
  name: string,
  label: string,
): InventoryFieldDefinition => ({
  name,
  label,
  kind: 'date',
})

const time = (
  name: string,
  label: string,
): InventoryFieldDefinition => ({
  name,
  label,
  kind: 'time',
})

const select = (
  name: string,
  label: string,
  optionsEndpoint: string,
  optionLabelFields: string[],
  required = false,
  optionValue = 'id',
): InventoryFieldDefinition => ({
  name,
  label,
  kind: 'select',
  optionsEndpoint,
  optionValue,
  optionLabelFields,
  required,
})

const boolean = (
  name: string,
  label: string,
  defaultValue = false,
): InventoryFieldDefinition => ({
  name,
  label,
  kind: 'boolean',
  defaultValue,
})

const inventoryPrefix = '/inventory'
const stockItemsEndpoint = `${inventoryPrefix}/stock-items`
const stockGroupsEndpoint = `${inventoryPrefix}/stock-groups`
const gateEntriesEndpoint = `${inventoryPrefix}/gate-entries`
const gateEntryItemsEndpoint = `${inventoryPrefix}/gate-entry-items`

const inventoryResources: InventoryResourceDefinition[] = [
  {
    key: 'unit-of-measures',
    label: 'Unit of Measure',
    endpoint: `${inventoryPrefix}/unit-of-measures`,
    fields: [
      text('symbol', 'Symbol', 20, true),
      text('name', 'Name', 100, true),
      number('number_of_decimals', 'Number of decimals', {
        step: 0.1,
        defaultValue: 0,
      }),
    ],
    displayColumns: [
      { field: 'symbol', label: 'Symbol' },
      { field: 'name', label: 'Name' },
      {
        field: 'number_of_decimals',
        label: 'Decimals',
      },
    ],
  },
  {
    key: 'stock-groups',
    label: 'Stock Group',
    endpoint: stockGroupsEndpoint,
    fields: [
      text('name', 'Name', 150, true),
      select(
        'under_stock_group_id',
        'Under stock group',
        stockGroupsEndpoint,
        ['name'],
      ),
    ],
    displayColumns: [
      { field: 'name', label: 'Name' },
      {
        field: 'under_stock_group_id',
        label: 'Parent group ID',
      },
    ],
  },
  {
    key: 'stock-items',
    label: 'Stock Item',
    endpoint: stockItemsEndpoint,
    fields: [
      text('name', 'Name', 200, true),
      select(
        'unit_of_measure_id',
        'Unit of measure',
        `${inventoryPrefix}/unit-of-measures`,
        ['name', 'symbol'],
        true,
      ),
      select(
        'stock_group_id',
        'Stock group',
        stockGroupsEndpoint,
        ['name'],
        true,
      ),
      boolean(
        'select_costing',
        'Select costing',
      ),
      select(
        'gl_account_id',
        'GL account',
        '/gl-accounts/',
        ['name'],
      ),
      select(
        'hsn_master_id',
        'HSN master',
        '/gl-hsn-masters/',
        ['hsn_code', 'description'],
      ),
      select(
        'sac_master_id',
        'SAC master',
        '/gl-sac-masters/',
        ['sac_code', 'description'],
      ),
    ],
    displayColumns: [
      { field: 'name', label: 'Name' },
      {
        field: 'unit_of_measure_id',
        label: 'UOM ID',
      },
      {
        field: 'stock_group_id',
        label: 'Stock group ID',
      },
      {
        field: 'select_costing',
        label: 'Select costing',
      },
    ],
  },
  {
    key: 'indents',
    label: 'Indent',
    endpoint: `${inventoryPrefix}/indents`,
    fields: [
      text(
        'indent_no',
        'Indent number',
        50,
        true,
      ),
      {
        name: 'indent_date',
        label: 'Indent date',
        kind: 'datetime-local',
      },
      number(
        'department_id',
        'Department ID',
        {
          step: 1,
        },
      ),
      {
        name: 'status',
        label: 'Status',
        kind: 'select',
        choices: [
          {
            value: 'Creation',
            label: 'Creation',
          },
          {
            value: 'Approved',
            label: 'Approved',
          },
        ],
      },
    ],
    displayColumns: [
      {
        field: 'indent_no',
        label: 'Indent number',
      },
      {
        field: 'indent_date',
        label: 'Indent date',
      },
      {
        field: 'department_id',
        label: 'Department ID',
      },
      {
        field: 'status',
        label: 'Status',
      },
    ],
    items: {
      endpoint: `${inventoryPrefix}/indent-items`,
      parentField: 'indent_id',
      fields: [
        select(
          'indent_id',
          'Indent',
          `${inventoryPrefix}/indents`,
          ['indent_no'],
          true,
        ),
        select(
          'stock_item_id',
          'Stock item',
          stockItemsEndpoint,
          ['name'],
          true,
        ),
        number(
          'quantity',
          'Quantity',
          {
            step: 0.001,
          },
        ),
      ],
    },
  },
  {
    key: 'gate-entries',
    label: 'Gate Entry',
    endpoint: gateEntriesEndpoint,
    fields: [
      date(
        'entry_date',
        'Entry date',
      ),
      time(
        'entry_time',
        'Entry time',
      ),
      text(
        'vendor_invoice_no',
        'Vendor invoice number',
        100,
      ),
      date(
        'vendor_invoice_date',
        'Vendor invoice date',
      ),
      text(
        'vendor_name',
        'Vendor name',
        200,
      ),
      longText(
        'vendor_address',
        'Vendor address',
        500,
      ),
      text(
        'transporter_name',
        'Transporter name',
        200,
      ),
      text(
        'vehicle_no',
        'Vehicle number',
        50,
      ),
      {
        name: 'status',
        label: 'Status',
        kind: 'select',
        choices: [
          {
            value: 'Creation',
            label: 'Creation',
          },
          {
            value: 'Approved',
            label: 'Approved',
          },
        ],
      },
      text(
        'scan_copy_path',
        'Scan copy path',
        500,
      ),
    ],
    displayColumns: [
      {
        field: 'gate_entry_no',
        label: 'Gate entry number',
      },
      {
        field: 'entry_date',
        label: 'Entry date',
      },
      {
        field: 'vendor_name',
        label: 'Vendor',
      },
      {
        field: 'vehicle_no',
        label: 'Vehicle number',
      },
      {
        field: 'status',
        label: 'Status',
      },
    ],
    items: {
      endpoint: gateEntryItemsEndpoint,
      parentField: 'gate_entry_id',
      fields: [
        select(
          'gate_entry_id',
          'Gate entry',
          gateEntriesEndpoint,
          [
            'gate_entry_no',
            'vendor_name',
          ],
          true,
        ),
        select(
          'stock_item_id',
          'Stock item',
          stockItemsEndpoint,
          ['name'],
          true,
        ),
        number(
          'quantity',
          'Quantity',
          {
            step: 0.001,
          },
        ),
        number(
          'rate',
          'Rate',
          {
            step: 0.01,
          },
        ),
      ],
    },
  },
  {
    key: 'material-receipt-notes',
    label: 'Material Receipt Note',
    endpoint: `${inventoryPrefix}/material-receipt-notes`,
    fields: [
      text(
        'mrn_no',
        'MRN number',
        50,
        true,
      ),
      date(
        'mrn_date',
        'MRN date',
      ),
      time(
        'mrn_time',
        'MRN time',
      ),
      select(
        'gate_entry_id',
        'Gate entry',
        gateEntriesEndpoint,
        [
          'gate_entry_no',
          'vendor_name',
        ],
      ),
      text(
        'purchase_order_no',
        'Purchase order number',
        100,
      ),
      date(
        'purchase_order_date',
        'Purchase order date',
      ),
      text(
        'vendor_invoice_no',
        'Vendor invoice number',
        100,
      ),
      date(
        'vendor_invoice_date',
        'Vendor invoice date',
      ),
      text(
        'vendor_name',
        'Vendor name',
        200,
      ),
      longText(
        'vendor_address',
        'Vendor address',
        500,
      ),
      text(
        'eway_bill_no',
        'E-way bill number',
        100,
      ),
      date(
        'eway_bill_date',
        'E-way bill date',
      ),
      text(
        'transporter_name',
        'Transporter name',
        200,
      ),
      text(
        'vehicle_no',
        'Vehicle number',
        50,
      ),
      {
        name: 'status',
        label: 'Status',
        kind: 'select',
        choices: [
          {
            value: 'Creation',
            label: 'Creation',
          },
          {
            value: 'Approved',
            label: 'Approved',
          },
        ],
      },
    ],
    displayColumns: [
      {
        field: 'mrn_no',
        label: 'MRN number',
      },
      {
        field: 'mrn_date',
        label: 'MRN date',
      },
      {
        field: 'vendor_name',
        label: 'Vendor',
      },
      {
        field: 'gate_entry_id',
        label: 'Gate entry ID',
      },
      {
        field: 'status',
        label: 'Status',
      },
    ],
    items: {
      endpoint: `${inventoryPrefix}/material-receipt-note-items`,
      parentField: 'mrn_id',
      fields: [
        select(
          'mrn_id',
          'Material receipt note',
          `${inventoryPrefix}/material-receipt-notes`,
          [
            'mrn_no',
            'vendor_name',
          ],
          true,
        ),
        select(
          'gate_entry_item_id',
          'Gate entry item',
          gateEntryItemsEndpoint,
          [
            'id',
            'stock_item_id',
            'quantity',
          ],
        ),
        select(
          'stock_item_id',
          'Stock item',
          stockItemsEndpoint,
          ['name'],
          true,
        ),
        number(
          'quantity',
          'Quantity',
          {
            step: 0.001,
          },
        ),
        number(
          'rate',
          'Rate',
          {
            step: 0.01,
          },
        ),
        {
          name: 'costing_purpose',
          label: 'Costing purpose',
          kind: 'select',
          choices: [
            {
              value: 'Purchase',
              label: 'Purchase',
            },
            {
              value: 'Production',
              label: 'Production',
            },
            {
              value: 'Transfer',
              label: 'Transfer',
            },
          ],
        },
      ],
    },
  },
  {
    key: 'delivery-challans',
    label: 'Delivery Challan',
    endpoint: `${inventoryPrefix}/delivery-challans`,
    fields: [
      date(
        'delivery_challan_date',
        'Delivery challan date',
      ),
      {
        name: 'purpose',
        label: 'Purpose',
        kind: 'select',
        required: true,
        choices: [
          {
            value: 'Delivery',
            label: 'Delivery',
          },
          {
            value: 'Jobwork',
            label: 'Jobwork',
          },
        ],
      },
      text(
        'transporter_name',
        'Transporter name',
        200,
      ),
      text(
        'vehicle_no',
        'Vehicle number',
        50,
      ),
      boolean(
        'eway_bill_required',
        'E-way bill required',
      ),
      text(
        'eway_bill_no',
        'E-way bill number',
        100,
      ),
      date(
        'eway_bill_date',
        'E-way bill date',
      ),
      {
        name: 'status',
        label: 'Status',
        kind: 'select',
        choices: [
          {
            value: 'Creation',
            label: 'Creation',
          },
          {
            value: 'Checked',
            label: 'Checked',
          },
          {
            value: 'Approved',
            label: 'Approved',
          },
        ],
      },
    ],
    displayColumns: [
      {
        field: 'delivery_challan_no',
        label: 'Challan number',
      },
      {
        field: 'delivery_challan_date',
        label: 'Challan date',
      },
      {
        field: 'purpose',
        label: 'Purpose',
      },
      {
        field: 'vehicle_no',
        label: 'Vehicle number',
      },
      {
        field: 'status',
        label: 'Status',
      },
    ],
    items: {
      endpoint: `${inventoryPrefix}/delivery-challan-items`,
      parentField: 'delivery_challan_id',
      fields: [
        select(
          'delivery_challan_id',
          'Delivery challan',
          `${inventoryPrefix}/delivery-challans`,
          [
            'delivery_challan_no',
            'purpose',
          ],
          true,
        ),
        select(
          'stock_item_id',
          'Stock item',
          stockItemsEndpoint,
          ['name'],
          true,
        ),
        number(
          'quantity',
          'Quantity',
          {
            step: 0.001,
          },
        ),
        number(
          'rate',
          'Rate',
          {
            step: 0.01,
          },
        ),
        number(
          'gst',
          'GST',
          {
            step: 0.01,
          },
        ),
        text(
          'vendor_invoice_no',
          'Vendor invoice number',
          100,
        ),
        date(
          'vendor_invoice_date',
          'Vendor invoice date',
        ),
      ],
    },
  },
  {
    key: 'delivery-challan-inwards',
    label: 'Delivery Challan Inward',
    endpoint: `${inventoryPrefix}/delivery-challan-inwards`,
    fields: [
      date(
        'delivery_challan_date',
        'Delivery challan date',
      ),
      {
        name: 'purpose',
        label: 'Purpose',
        kind: 'select',
        required: true,
        choices: [
          {
            value: 'Delivery',
            label: 'Delivery',
          },
          {
            value: 'Jobwork',
            label: 'Jobwork',
          },
        ],
      },
      text(
        'job_worker',
        'Job worker',
        200,
      ),
      longText(
        'address',
        'Address',
        500,
      ),
      text(
        'work_order_no',
        'Work order number',
        100,
      ),
      date(
        'work_order_date',
        'Work order date',
      ),
      text(
        'transporter_name',
        'Transporter name',
        200,
      ),
      text(
        'vehicle_no',
        'Vehicle number',
        50,
      ),
      boolean(
        'eway_bill_required',
        'E-way bill required',
      ),
      text(
        'eway_bill_no',
        'E-way bill number',
        100,
      ),
      date(
        'eway_bill_date',
        'E-way bill date',
      ),
      {
        name: 'status',
        label: 'Status',
        kind: 'select',
        choices: [
          {
            value: 'Creation',
            label: 'Creation',
          },
          {
            value: 'Checked',
            label: 'Checked',
          },
          {
            value: 'Approved',
            label: 'Approved',
          },
        ],
      },
    ],
    displayColumns: [
      {
        field: 'delivery_challan_no',
        label: 'Challan number',
      },
      {
        field: 'delivery_challan_date',
        label: 'Challan date',
      },
      {
        field: 'purpose',
        label: 'Purpose',
      },
      {
        field: 'job_worker',
        label: 'Job worker',
      },
      {
        field: 'status',
        label: 'Status',
      },
    ],
    items: {
      endpoint: `${inventoryPrefix}/delivery-challan-inward-items`,
      parentField:
        'delivery_challan_inward_id',
      fields: [
        select(
          'delivery_challan_inward_id',
          'Delivery challan inward',
          `${inventoryPrefix}/delivery-challan-inwards`,
          [
            'delivery_challan_no',
            'job_worker',
          ],
          true,
        ),
        select(
          'stock_item_id',
          'Stock item',
          stockItemsEndpoint,
          ['name'],
          true,
        ),
        number(
          'quantity',
          'Quantity',
          {
            step: 0.001,
          },
        ),
        number(
          'rate',
          'Rate',
          {
            step: 0.01,
          },
        ),
        number(
          'gst',
          'GST',
          {
            step: 0.01,
          },
        ),
        text(
          'vendor_invoice_no',
          'Vendor invoice number',
          100,
        ),
        date(
          'vendor_invoice_date',
          'Vendor invoice date',
        ),
      ],
    },
  },
  {
    key: 'goods-issues',
    label: 'Goods Issue',
    endpoint: `${inventoryPrefix}/goods-issues`,
    fields: [
      select(
        'indent_id',
        'Indent',
        `${inventoryPrefix}/indents`,
        ['indent_no'],
        true,
      ),
      date(
        'indent_date',
        'Indent date',
      ),
      number(
        'department_id',
        'Department ID',
        {
          step: 1,
        },
      ),
      {
        name: 'status',
        label: 'Status',
        kind: 'select',
        choices: [
          {
            value: 'Creation',
            label: 'Creation',
          },
          {
            value: 'Checked',
            label: 'Checked',
          },
          {
            value: 'Approved',
            label: 'Approved',
          },
        ],
      },
    ],
    displayColumns: [
      {
        field: 'indent_id',
        label: 'Indent ID',
      },
      {
        field: 'indent_date',
        label: 'Indent date',
      },
      {
        field: 'department_id',
        label: 'Department ID',
      },
      {
        field: 'status',
        label: 'Status',
      },
    ],
    items: {
      endpoint: `${inventoryPrefix}/goods-issue-items`,
      parentField: 'goods_issue_id',
      fields: [
        select(
          'goods_issue_id',
          'Goods issue',
          `${inventoryPrefix}/goods-issues`,
          [
            'id',
            'indent_id',
          ],
          true,
        ),
        select(
          'stock_item_id',
          'Stock item',
          stockItemsEndpoint,
          ['name'],
          true,
        ),
        number(
          'quantity',
          'Quantity',
          {
            step: 0.001,
            required: true,
          },
        ),
        number(
          'cost_element_id',
          'Cost element ID',
          {
            step: 1,
          },
        ),
      ],
    },
  },
  {
    key: 'goods-issue-sales',
    label: 'Goods Issue Sale',
    endpoint: `${inventoryPrefix}/goods-issue-sales`,
    fields: [
      number(
        'sale_order_id',
        'Sale order ID',
        {
          step: 1,
        },
      ),
    ],
    displayColumns: [
      {
        field: 'sale_order_id',
        label: 'Sale order ID',
      },
    ],
    items: {
      endpoint: `${inventoryPrefix}/goods-issue-sale-items`,
      parentField:
        'goods_issue_sale_id',
      fields: [
        select(
          'goods_issue_sale_id',
          'Goods issue sale',
          `${inventoryPrefix}/goods-issue-sales`,
          [
            'id',
            'sale_order_id',
          ],
          true,
        ),
        select(
          'stock_item_id',
          'Stock item',
          stockItemsEndpoint,
          ['name'],
          true,
        ),
        number(
          'quantity',
          'Quantity',
          {
            step: 0.001,
            required: true,
          },
        ),
        number(
          'cost_element_id',
          'Cost element ID',
          {
            required: true,
            step: 1,
          },
        ),
      ],
    },
  },
]

export function getInventoryResourceDefinition(
  key: InventoryResourceKey,
): InventoryResourceDefinition {
  const resource = inventoryResources.find(
    (candidate) => candidate.key === key,
  )

  if (!resource) {
    throw new Error(
      `Unknown inventory resource: ${key}`,
    )
  }

  return resource
}

export const inventoryNavigationItems =
  inventoryResources.map(
    ({ key, label }) => ({
      label,
      path: `/inventory/${key}/create`,
    }),
  )