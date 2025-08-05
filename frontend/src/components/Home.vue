<template>
  <el-form ref="form" class="form" label-position="top">
    <div
      style="
        width: 100%;
        padding-left: 10px;
        border-left: 5px solid #2598f8;
        margin-bottom: 20px;
        padding-top: 5px;
      "
    >
      {{ $t("title") }}
    </div>
    <el-alert
      style="margin: 20px 0; color: #606266"
      :title="$t('alerts.selectNumberField')"
      type="info"
    />
    <div class="helper-doc">
      <span>{{ $t("helpTip") }}</span>
      <span style="height: 16px; width: 16px; margin-left: 12px">
        <a
          href="https://aigccamp.feishu.cn/wiki/LvQRwI1A4iYtnMkOBtZc2zfsnMd"
          target="_blank"
          ><span>说明文档</span></a
        >
      </span>
    </div>

    <!-- 获取数据类型 -->
    <el-form-item
      style="margin-top: 40px"
      :label="$t('labels.dataType')"
      size="large"
      required
    >
      <el-select
        v-model="dataType"
        :placeholder="$t('placeholder.dataType')"
        style="width: 100%"
      >
        <el-option
          v-for="meta in canChooseDateType"
          :key="meta.value"
          :label="meta.label"
          :value="meta"
        />
      </el-select>
    </el-form-item>

    <!-- xhsCookie 输入框 -->
    <!-- <el-form-item style="margin-top: 20px;" :label="$t('labels.xhsCookie')" size="large" required v-if="dataType.value != 'douyinDetail'">
      <el-input v-model="xhsCookie" type="text" :placeholder="$t('placeholder.xhsCookie')"></el-input>
    </el-form-item> -->

    <!-- X-S-Common 输入框 -->
    <!-- <el-form-item style="margin-top: 20px;" :label="$t('labels.xSCommon')" size="large" v-if="dataType.value != 'douyinDetail'">
      <el-input v-model="xSCommon" type="text" :placeholder="$t('placeholder.xSCommon')"></el-input>
    </el-form-item> -->

    <!-- cookie 输入框 -->
    <el-form-item
      style="margin-top: 20px"
      :label="$t('labels.cookie')"
      size="large"
      v-if="dataType.value.includes('douyin')"
    >
      <el-input
        v-model="cookie"
        type="text"
        :placeholder="$t('placeholder.cookie')"
        style="width: 64%"
        clearable
      ></el-input>
      <el-button
        @click="addDouyinAccount"
        type="primary"
        plain
        style="margin-left: 10px"
        >添加账号</el-button
      >
    </el-form-item>

    <!-- 链接所在列 -->
    <!-- <el-form-item
      style="margin-top: 40px"
      :label="$t('labels.link')"
      size="large"
      required
    >
      <el-select
        v-model="linkFieldId"
        :placeholder="$t('placeholder.link')"
        style="width: 100%"
      >
        <el-option
          v-for="meta in fieldListSeView"
          :key="meta.id"
          :label="meta.name"
          :value="meta.id"
        />
      </el-select>
    </el-form-item> -->

    <!-- 字段选择 -->
    <div class="map-fields-checklist">
      <el-checkbox
        v-model="checkAllToMap"
        :indeterminate="isIndeterminateToMap"
        @change="handlecheckAllToMapChange"
        >{{ $t("selectGroup.selectAll") }}</el-checkbox
      >
      <el-checkbox-group
        v-model="checkedFieldsToMap"
        @change="handleCheckedFieldsToMapChange"
      >
        <el-checkbox
          v-for="fieldToMap in fieldsToMap"
          :key="fieldToMap.label"
          :label="fieldToMap.label"
        >
          {{ fieldToMap.name }}
        </el-checkbox>
      </el-checkbox-group>
    </div>
    <el-alert
      style="
        display: flex;
        align-items: flex-start;
        margin: 20px 0;
        background-color: #e1eaff;
        color: #606266;
      "
      :title="$t('alerts.selectGroupFieldTip')"
      type="info"
      show-icon
    />

    <!-- 提交按钮 -->
    <el-button
      v-loading="isWritingData"
      @click="writeData"
      color="#3370ff"
      type="primary"
      plain
      size="large"
      >{{ $t("submit") }}</el-button
    >
  </el-form>
</template>

<script setup>
import { bitable, FieldType } from "@lark-base-open/js-sdk";
import { useI18n } from "vue-i18n";
import { ref, onMounted, computed } from "vue";
import {
  completeMappedFields,
  getCellValueByCell,
  setRecord,
  addRecords,
} from "../utils/tableUtils.js";
// 导入方式
import { api, douyinApi, redbookApi, request } from "@/utils/api.js";
import { config } from "../utils/config.js";
import { GetID } from "../utils/index.js";
import { i18n } from "../locales/i18n.js";
import { watch } from "vue";

// -- 数据区域
const { t } = useI18n();
const lang = i18n.global.locale;

const canChooseDateType = ref(config.dataType);
const dataType = ref(config.dataType[0]);
const canChooseField = computed(() => dataType.value.canChooseField);
// 可选择字段展示map
const fieldsToMap = computed(() =>
  canChooseField.value.map((field) => ({
    label: field,
    name: config.feilds[field][lang],
  }))
);
// 已选择字段
const checkedFieldsToMap = ref(canChooseField.value); // 默认的to-map的字段
watch(canChooseField, () => {
  checkedFieldsToMap.value = canChooseField.value;
});

const fieldListSeView = ref([]);
const linkFieldId = ref(""); // 链接字段Id

const isWritingData = ref(false);
// 是否全选
const checkAllToMap = ref(false);
const isIndeterminateToMap = ref(true);
const cookie = ref("");
const xhsCookie = ref("");
const xSCommon = ref("");

// 字段在表格对应的列
const mappedFieldIds = ref({});

const addDouyinAccount = async () => {
  const response = await douyinApi.addDouyinAccount(cookie.value);
  console.log("addDouyinAccount() >> response", response);
};

// -- 核心算法区域
// --001== 写入数据
const writeData = async () => {
  var errorCount = 0;
  isWritingData.value = true;

  const selection = await bitable.base.getSelection();

  console.log("writeData() >> selection", selection);
  // 获取字段所在列，匹配已有的字段，创建缺少的字段
  const mappedFields = await completeMappedFields(
    selection,
    checkedFieldsToMap.value
  );
  mappedFieldIds.value = mappedFields;

  // 加载bitable实例
  const { tableId, viewId } = selection;
  const table = await bitable.base.getActiveTable();
  const view = await table.getViewById(viewId);

  // ## mode1: 全部记录
  // const recordList = await view.getVisibleRecordIdList()

  // ## model2: 交互式选择记录
  const recordList = await bitable.ui.selectRecordIdList(tableId, viewId);

  localStorage.setItem("cookie", cookie.value); // string 类型
  localStorage.setItem("xhsCookie", xhsCookie.value); // string 类型
  localStorage.setItem("dataType", JSON.stringify(dataType.value)); // string 类型
  localStorage.setItem("xSCommon", xSCommon.value); // string 类型

  // 错误处理，链接字段格式错误，应为文本类型
  const linkField = await table.getFieldMetaById(linkFieldId.value);
  if (linkField.type !== FieldType.Text) {
    await bitable.ui.showToast({
      toastType: "warning",
      message: `[${linkField.name}] ${t("errorTip.errorLinkType")}`,
    });
    isWritingData.value = false;
  }

  for (var recordId of recordList) {
    try {
      console.log("writeData() >> recordId", recordId);

      var link = await getCellValueByCell(table, recordId, linkFieldId.value);
      if (!link) {
        throw new Error(t("errorTip.emptyNoteLink"));
      }

      // 显示数据获取进度
      await bitable.ui.showToast({
        toastType: "info",
        message: `正在获取数据... (${recordList.indexOf(recordId) + 1}/${
          recordList.length
        })`,
      });

      var response = await getQueryParams(link, dataType.value);

      console.log("writeData() >> response", response);
      if (!response || response.code == -1) {
        const errorData = { msg: response?.msg || "获取数据为空，请重试" };
        await setRecord(table, recordId, errorData, mappedFields);
      } else {
        const infoData = response.data;
        // 显示进度提示
        await bitable.ui.showToast({
          toastType: "info",
          message: `正在处理 ${infoData.length} 条视频数据，请稍等...`,
        });
        if (Array.isArray(infoData)) {
          // 逐条处理并写入，而不是批量写入
          for (let i = 0; i < infoData.length; i++) {
            const singleData = infoData[i];
            console.log(
              `正在处理第 ${i + 1}/${infoData.length} 条数据:`,
              singleData
            );

            // 使用addRecords处理单条数据，这样可以复用现有的字段处理逻辑
            await addRecords(table, [singleData], mappedFields);
            console.log(`第 ${i + 1} 条数据写入完成`);
          }
        } else {
          await setRecord(table, recordId, infoData, mappedFields);
        }
      }
    } catch (err) {
      console.error(err);
      await bitable.ui.showToast({
        toastType: "warning",
        message: err.message,
      });
      errorCount += 1;
    }
  }

  isWritingData.value = false;
  await bitable.ui.showToast({
    toastType: "success",
    message: `${t("finishTip")} ${errorCount}`,
  });
};

/*
 * 请求接口获取数据
 */
const getQueryParams = async (link, dataType) => {
  console.log("getQueryParams() >> link", link, dataType.value);
  // 抖音视频详情数据
  if (dataType.value === "douyinDetail") {
    return await douyinApi.getGouyinDetail(link);
  }
  // 抖音作者视频列表
  if (dataType.value === "douyinDouyinUserList") {
    return await douyinApi.getDouyinUserList(link);
  }
  return { code: -1, msg: "获取数据错误" };
};

// Map==全选事件
const handlecheckAllToMapChange = (val) => {
  const data = JSON.parse(JSON.stringify(fieldsToMap.value));
  console.log("val", val);
  if (val) {
    checkedFieldsToMap.value = [];
    for (const item of data) {
      checkedFieldsToMap.value.push(item.label);
    }
  } else {
    checkedFieldsToMap.value = [];
  }
  isIndeterminateToMap.value = false;
  console.log("checkedFieldsToMap:", checkedFieldsToMap.value);
};
// Map==字段选择事件
const handleCheckedFieldsToMapChange = (value) => {
  const checkedCount = value.length;
  checkAllToMap.value = checkedCount === fieldsToMap.value.length;
  isIndeterminateToMap.value =
    checkedCount > 0 && checkedCount < fieldsToMap.value.length;
  console.log("checkedFieldsToMap:", checkedFieldsToMap.value);
};

onMounted(async () => {
  // 获取字段列表 -- start
  const selection = await bitable.base.getSelection();
  const table = await bitable.base.getActiveTable();
  const view = await table.getViewById(selection.viewId);
  fieldListSeView.value = await view.getFieldMetaList();
  // console.log("onMounted >> 多维表格字段", fieldListSeView.value);
  // console.log("onMounted >> 已选中的采集数据字段", checkedFieldsToMap.value);

  // 设置链接字段的默认值
  const setDefaultLinkField = () => {
    try {
      // 检查字段列表是否有效
      if (!Array.isArray(fieldListSeView.value)) {
        console.warn("字段列表无效");
        return;
      }

      // 优先匹配名称包含关键词的文本字段
      const keywords = ["链接", "url", "link", "地址"];
      const textFields = fieldListSeView.value.filter(
        (field) =>
          field && field.type === FieldType.Text && field.id && field.name
      );

      if (textFields.length === 0) {
        console.warn("未找到文本类型的字段");
        return;
      }

      // 先尝试匹配包含关键词的字段
      const matchedField = textFields.find((field) =>
        keywords.some((keyword) =>
          field.name.toLowerCase().includes(keyword.toLowerCase())
        )
      );

      // 如果找到匹配的字段，使用它；否则使用第一个文本字段
      if (matchedField) {
        linkFieldId.value = matchedField.id;
        console.log("已自动选择匹配的链接字段:", matchedField.name);
      } else {
        linkFieldId.value = textFields[0].id;
        console.log("已自动选择第一个文本字段:", textFields[0].name);
      }

      // 保存到 localStorage，以便下次使用
      localStorage.setItem("lastLinkFieldId", linkFieldId.value);
    } catch (error) {
      console.error("设置默认链接字段失败:", error);
    }
  };

  // 尝试从 localStorage 恢复上次选择的字段
  if (localStorage.getItem("lastLinkFieldId")) {
    const lastFieldId = localStorage.getItem("lastLinkFieldId");
    const fieldExists = fieldListSeView.value.some(
      (field) => field.id === lastFieldId
    );
    if (fieldExists) {
      linkFieldId.value = lastFieldId;
      console.log("已恢复上次选择的链接字段");
    } else {
      setDefaultLinkField();
    }
  } else {
    setDefaultLinkField();
  }

  if (localStorage.getItem("cookie") !== null) {
    // string 类型
    cookie.value = localStorage.getItem("cookie");
  }
  if (localStorage.getItem("xhsCookie") !== null) {
    // string 类型
    xhsCookie.value = localStorage.getItem("xhsCookie");
  }
  if (localStorage.getItem("xSCommon") !== null) {
    // string 类型
    xSCommon.value = localStorage.getItem("xSCommon");
  }
  if (localStorage.getItem("dataType") !== null) {
    // string 类型
    dataType.value = JSON.parse(localStorage.getItem("dataType"));
  } else {
    dataType.value = config.dataType[0];
  }
});
</script>

<style scoped>
.helper-doc {
  margin-top: -10px;
  font-size: 14px;
}
.helper-doc a {
  color: #409eff;
}
.helper-doc a:hover {
  color: #7abcff;
}
</style>
