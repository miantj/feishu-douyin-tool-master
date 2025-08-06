<template>
  <div class="monitor-manage">
    <div class="header">
      <h2>{{ $t("monitor.title") }}</h2>
      <p>{{ $t("monitor.subtitle") }}</p>
    </div>

    <el-tabs v-model="activeTab" type="border-card">
      <!-- 博主管理 -->
      <el-tab-pane :label="$t('monitor.tabs.users')" name="users">
        <div class="users-header">
          <el-button type="primary" @click="showAddDialog">
            {{ $t("monitor.users.add") }}
          </el-button>
        </div>

        <el-table :data="users" stripe>
          <el-table-column
            prop="nickname"
            :label="$t('monitor.users.nickname')"
          />
          <el-table-column
            prop="profile_url"
            :label="$t('monitor.users.profileUrl')"
            width="250"
          >
            <template #default="scope">
              <el-link
                :href="scope.row.profile_url"
                target="_blank"
                type="primary"
              >
                {{ scope.row.profile_url || scope.row.sec_user_id }}
              </el-link>
            </template>
          </el-table-column>
          <el-table-column
            prop="like_threshold"
            :label="$t('monitor.users.likeThreshold')"
            width="120"
          >
            <template #default="scope">
              {{ scope.row.like_threshold?.toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column :label="$t('monitor.users.status')" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.enabled ? 'success' : 'info'">
                {{ scope.row.enabled ? "启用" : "停用" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('monitor.users.actions')" width="180">
            <template #default="scope">
              <el-button
                size="small"
                @click="editUser(scope.row, scope.$index)"
              >
                {{ $t("monitor.users.edit") }}
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click="deleteUser(scope.$index)"
              >
                {{ $t("monitor.users.delete") }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 基础配置 -->
      <el-tab-pane :label="$t('monitor.tabs.config')" name="config">
        <el-card>
          <el-form :model="config" label-width="150px" size="default">
            <el-form-item :label="$t('monitor.config.enabled')">
              <el-switch
                v-model="config.enabled"
                @change="handleToggleMonitor"
                :active-text="config.enabled ? '已启用' : '已停用'"
              />
            </el-form-item>

            <el-form-item :label="$t('monitor.config.interval')">
              <el-input-number
                v-model="config.interval_hours"
                :min="1"
                :max="24"
                :step="1"
              />
            </el-form-item>

            <el-form-item :label="$t('monitor.config.feishuWebhook')">
              <template #label>
                <span style="display: flex; align-items: center">
                  {{ $t("monitor.config.feishuWebhook") }}
                  <el-tooltip placement="top">
                    <template #content>
                      <div style="width: 200px">
                        <p>
                          <img
                            src="../assets/145706.png"
                            alt="feishu"
                            style="width: 470px"
                          />
                          在飞书群聊中添加自定义机器人，获取机器人的Webhook地址并填写到此处
                        </p>
                      </div>
                    </template>
                    <el-icon class="el-icon--right"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </span>
              </template>

              <el-input
                v-model="config.feishu_webhook_url"
                type="textarea"
                :rows="3"
                :placeholder="$t('monitor.dialog.webhookPlaceholder')"
              />
            </el-form-item>

            <el-form-item :label="$t('monitor.config.videosPerCheck')">
              <el-input-number
                v-model="config.videos_per_check"
                :min="5"
                :max="50"
                :step="5"
              />
            </el-form-item>

            <el-form-item :label="$t('monitor.config.recentHours')">
              <el-input-number
                v-model="config.recent_hours"
                :min="1"
                :max="168"
                :step="1"
              />
            </el-form-item>

            <el-form-item :label="$t('monitor.config.enableDeduplication')">
              <template #label>
                <span style="display: flex; align-items: center">
                  {{ $t("monitor.config.enableDeduplication") }}
                  <el-tooltip placement="top" content="相同视频不会重复通知">
                    <el-icon class="el-icon--right"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </span>
              </template>
              <el-switch v-model="config.enable_deduplication" />
            </el-form-item>

            <el-form-item :label="$t('monitor.config.dedupCacheHours')">
              <el-input-number
                v-model="config.dedup_cache_hours"
                :min="1"
                :max="720"
                :step="1"
              />
            </el-form-item>

            <el-form-item label-width="10px">
              <div style="text-align: center; width: 100%">
                <el-button type="primary" @click="saveConfig" :loading="saving">
                  {{ $t("monitor.config.save") }}
                </el-button>
                <el-button @click="runMonitorOnce" :loading="running">
                  {{ $t("monitor.config.runOnce") }}
                </el-button>
                <el-button
                  @click="testNotification"
                  :loading="testing"
                  type="success"
                >
                  {{ $t("monitor.config.testNotification") }}
                </el-button>
              </div>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- 监控状态 -->
      <el-tab-pane :label="$t('monitor.tabs.status')" name="status">
        <el-card>
          <el-descriptions :column="2" border>
            <el-descriptions-item :label="$t('monitor.status.monitorEnabled')">
              <el-tag :type="status.enabled ? 'success' : 'danger'">
                {{ status.enabled ? "已启用" : "已停用" }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item :label="$t('monitor.status.totalUsers')">
              {{ status.total_users }} / {{ status.monitored_users }}
              {{ $t("monitor.status.enabledUsers") }}
            </el-descriptions-item>
            <el-descriptions-item :label="$t('monitor.status.intervalHours')">
              {{ status.interval_hours }}小时
            </el-descriptions-item>
            <el-descriptions-item :label="$t('monitor.status.notifiedVideos')">
              {{ status.notified_videos_count }}
            </el-descriptions-item>
            <el-descriptions-item
              :label="$t('monitor.status.feishuConfigured')"
            >
              <el-tag :type="status.feishu_configured ? 'success' : 'warning'">
                {{ status.feishu_configured ? "已配置" : "未配置" }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item
              :label="$t('monitor.status.schedulerRunning')"
            >
              <el-tag
                :type="schedulerStatus.scheduler_running ? 'success' : 'danger'"
              >
                {{ schedulerStatus.scheduler_running ? "运行中" : "已停止" }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <div style="margin-top: 20px">
            <el-button @click="loadStatus" :loading="loadingStatus">
              刷新状态
            </el-button>
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 添加/编辑用户对话框 -->
    <el-dialog
      :title="
        isEditing ? $t('monitor.dialog.editUser') : $t('monitor.dialog.addUser')
      "
      v-model="dialogVisible"
      width="500px"
    >
      <el-form :model="currentUser" label-width="120px">
        <el-form-item :label="$t('monitor.users.profileUrl')" required>
          <el-input
            v-model="currentUser.profile_url"
            :placeholder="$t('monitor.dialog.profileUrlPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="$t('monitor.users.nickname')" required>
          <el-input
            v-model="currentUser.nickname"
            :placeholder="$t('monitor.dialog.nicknamePlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="$t('monitor.users.likeThreshold')" required>
          <el-input-number
            v-model="currentUser.like_threshold"
            :min="1"
            :step="1000"
            :placeholder="$t('monitor.dialog.likeThresholdPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="$t('monitor.users.enabled')">
          <el-switch v-model="currentUser.enabled" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUser" :loading="saving">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from "vue";
import { monitorApi } from "../utils/api.js";
import { QuestionFilled } from "@element-plus/icons-vue";

export default {
  name: "MonitorManage",
  components: {
    QuestionFilled,
  },
  setup() {
    const activeTab = ref("config");
    const loading = ref(false);
    const saving = ref(false);
    const running = ref(false);
    const testing = ref(false);
    const loadingStatus = ref(false);
    const dialogVisible = ref(false);
    const isEditing = ref(false);
    const editingIndex = ref(-1);

    // 配置数据
    const config = reactive({
      enabled: false,
      interval_hours: 1,
      feishu_webhook_url: "",
      videos_per_check: 10,
      recent_hours: 24,
      enable_deduplication: true,
      dedup_cache_hours: 72,
    });

    // 用户列表
    const users = ref([]);

    // 当前编辑的用户
    const currentUser = reactive({
      profile_url: "",
      nickname: "",
      like_threshold: 10000,
      enabled: true,
    });

    // 状态信息
    const status = reactive({
      enabled: false,
      total_users: 0,
      monitored_users: 0,
      interval_hours: 1,
      notified_videos_count: 0,
      feishu_configured: false,
    });

    const schedulerStatus = reactive({
      scheduler_running: false,
      jobs: [],
    });

    // 加载配置
    const loadConfig = async () => {
      try {
        const res = await monitorApi.getMonitorConfig();
        if (res.code === 0) {
          Object.assign(config, res.data);
        }
      } catch (error) {
        ElMessage.error("加载配置失败：" + error.message);
      }
    };

    // 加载用户列表
    const loadUsers = async () => {
      try {
        const res = await monitorApi.getMonitorUsers();
        if (res.code === 0) {
          users.value = res.data || [];
        }
      } catch (error) {
        ElMessage.error("加载用户列表失败：" + error.message);
      }
    };

    // 加载状态
    const loadStatus = async () => {
      loadingStatus.value = true;
      try {
        const [statusRes, schedulerRes] = await Promise.all([
          monitorApi.getMonitorStatus(),
          monitorApi.getSchedulerStatus(),
        ]);

        if (statusRes.code === 0) {
          Object.assign(status, statusRes.data);
        }
        if (schedulerRes.code === 0) {
          Object.assign(schedulerStatus, schedulerRes.data);
        }
      } catch (error) {
        ElMessage.error("加载状态失败：" + error.message);
      } finally {
        loadingStatus.value = false;
      }
    };

    // 保存配置
    const saveConfig = async () => {
      // 配置验证
      if (!config.feishu_webhook_url || !config.feishu_webhook_url.trim()) {
        ElMessage.warning("请输入飞书webhook地址");
        return;
      }
      if (config.interval_hours <= 0) {
        ElMessage.warning("监控间隔必须大于0小时");
        return;
      }
      if (config.videos_per_check <= 0 || config.videos_per_check > 50) {
        ElMessage.warning("每次检查视频数量必须在1-50之间");
        return;
      }
      if (config.recent_hours <= 0) {
        ElMessage.warning("最近视频检查时间必须大于0小时");
        return;
      }
      if (config.dedup_cache_hours <= 0) {
        ElMessage.warning("去重缓存时间必须大于0小时");
        return;
      }

      saving.value = true;
      try {
        const res = await monitorApi.updateMonitorConfig(config);
        if (res.code === 0) {
          ElMessage.success("配置保存成功");
          // 重新加载配置和状态，确保数据同步
          await Promise.all([loadConfig(), loadStatus()]);
        } else {
          ElMessage.error(res.msg || "保存失败");
        }
      } catch (error) {
        ElMessage.error("保存配置失败：" + error.message);
      } finally {
        saving.value = false;
      }
    };

    // 切换监控开关
    const handleToggleMonitor = async () => {
      try {
        const res = await monitorApi.toggleMonitor({ enabled: config.enabled });
        if (res.code === 0) {
          const action = config.enabled ? "启用" : "停用";
          ElMessage.success(`监控已${action}`);
          await loadStatus();
        } else {
          // 恢复开关状态
          config.enabled = !config.enabled;
          ElMessage.error(res.msg || "操作失败");
        }
      } catch (error) {
        config.enabled = !config.enabled;
        ElMessage.error("操作失败：" + error.message);
      }
    };

    // 立即执行监控
    const runMonitorOnce = async () => {
      running.value = true;
      try {
        const res = await monitorApi.runMonitorOnce();
        if (res.code === 0) {
          ElMessage.success("监控任务执行成功");
        } else {
          ElMessage.error(res.msg || "执行失败");
        }
      } catch (error) {
        ElMessage.error("执行失败：" + error.message);
      } finally {
        running.value = false;
      }
    };

    // 测试飞书通知
    const testNotification = async () => {
      testing.value = true;
      try {
        const res = await monitorApi.testNotification();
        if (res.code === 0) {
          ElMessage.success("测试通知发送成功");
        } else {
          ElMessage.error(res.msg || "发送失败");
        }
      } catch (error) {
        ElMessage.error("发送失败：" + error.message);
      } finally {
        testing.value = false;
      }
    };

    // 显示添加对话框
    const showAddDialog = () => {
      isEditing.value = false;
      editingIndex.value = -1;
      Object.assign(currentUser, {
        profile_url: "",
        nickname: "",
        like_threshold: 10000,
        enabled: true,
      });
      dialogVisible.value = true;
    };

    // 编辑用户
    const editUser = (user, index) => {
      isEditing.value = true;
      editingIndex.value = index;
      Object.assign(currentUser, user);
      dialogVisible.value = true;
    };

    // 保存用户
    const saveUser = async () => {
      // 增强表单验证
      if (!currentUser.profile_url || !currentUser.profile_url.trim()) {
        ElMessage.warning("请输入主页地址");
        return;
      }
      if (!currentUser.nickname || !currentUser.nickname.trim()) {
        ElMessage.warning("请输入博主昵称");
        return;
      }
      if (!currentUser.like_threshold || currentUser.like_threshold <= 0) {
        ElMessage.warning("点赞阈值必须大于0");
        return;
      }

      // 验证抖音URL格式（支持短链接和完整链接）
      const douyinUrlPattern = /douyin\.com/i;
      if (!douyinUrlPattern.test(currentUser.profile_url)) {
        ElMessage.warning("请输入有效的抖音主页地址");
        return;
      }

      saving.value = true;
      try {
        let res;
        if (isEditing.value) {
          res = await monitorApi.updateMonitorUser(
            editingIndex.value,
            currentUser
          );
        } else {
          res = await monitorApi.addMonitorUser(currentUser);
        }

        if (res.code === 0) {
          const action = isEditing.value ? "更新" : "添加";
          ElMessage.success(`博主${action}成功`);
          dialogVisible.value = false;
          await loadUsers();
          await loadStatus();
        } else {
          ElMessage.error(res.msg || "操作失败");
        }
      } catch (error) {
        ElMessage.error("操作失败：" + error.message);
      } finally {
        saving.value = false;
      }
    };

    // 删除用户
    const deleteUser = async (index) => {
      try {
        await ElMessageBox.confirm("确定要删除这个博主吗？", "确认删除", {
          type: "warning",
        });

        const res = await monitorApi.deleteMonitorUser(index);
        if (res.code === 0) {
          ElMessage.success("博主删除成功");
          await loadUsers();
          await loadStatus();
        } else {
          ElMessage.error(res.msg || "删除失败");
        }
      } catch (error) {
        if (error !== "cancel") {
          ElMessage.error("删除失败：" + error.message);
        }
      }
    };

    // 初始化加载数据
    onMounted(async () => {
      await Promise.all([loadConfig(), loadUsers(), loadStatus()]);
    });

    return {
      activeTab,
      loading,
      saving,
      running,
      loadingStatus,
      testing,
      dialogVisible,
      isEditing,
      config,
      users,
      currentUser,
      status,
      schedulerStatus,
      loadConfig,
      loadUsers,
      loadStatus,
      saveConfig,
      handleToggleMonitor,
      runMonitorOnce,
      testNotification,
      showAddDialog,
      editUser,
      saveUser,
      deleteUser,
    };
  },
};
</script>

<style scoped>
.monitor-manage {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.header p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.users-header {
  margin-bottom: 20px;
}

.el-tabs {
  background: white;
}

.el-card {
  margin-bottom: 20px;
}

.el-descriptions {
  margin-bottom: 20px;
}
</style>
