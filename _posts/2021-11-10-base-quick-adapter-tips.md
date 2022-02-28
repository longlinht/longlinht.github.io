---
layout: post
cover: false
title: BaseQuickAdapter使用tips
date:   2021-11-10 14:00:00
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: true

---

此文记录在实际工作中使用BaseQuickAdapter的一些经验和心得，以期新同学在第一次使用时免去踩坑的风险。

Tips:

* 如果adapter只有一种类型的item，则直接继承自BaseQuickAdapter，提供布局文件即可，例如:

```

class SelectedContactAdapter : BaseQuickAdapter<ContactUIItemData, BaseViewHolder>(layoutResId = R.layout.s_item_select_user_normal){
    override fun convert(holder: BaseViewHolder, item: ContactUIItemData) {
        holder.getView<UserFaceView>(R.id.ufv_avatar).bindUid(item.bean.account)
        addChildClickViewIds(R.id.ll_item)
    }
}

```

* 如果adapter需要多种类型的item，则需要继承自BaseMultiItemQuickAdapter，例如:

```

class ContactAdapter : BaseMultiItemQuickAdapter<ContactUIItemData, BaseViewHolder>() {

    var actionType = AppConstants.User.TYPE_CONTACT_NEW_MESSAGE

    init {
        addItemType(ITEM_TYPE_HEAD, R.layout.s_item_contact_head)
        addItemType(ITEM_TYPE_TITLE, R.layout.s_item_contact_title)
        addItemType(ITEM_TYPE_CONTACT, R.layout.s_item_single_contact)

        setDiffCallback(object : DiffUtil.ItemCallback<ContactUIItemData>() {
            override fun areItemsTheSame(
                oldItem: ContactUIItemData,
                newItem: ContactUIItemData
            ): Boolean {
                return oldItem.viewType == newItem.viewType
            }

            override fun areContentsTheSame(
                oldItem: ContactUIItemData,
                newItem: ContactUIItemData
            ): Boolean {
                if (newItem.viewType == ITEM_TYPE_CONTACT) {
                    return TextUtils.equals(newItem.bean.account, oldItem.bean.account) && TextUtils.equals(newItem.bean.name, oldItem.bean.name)
                    && TextUtils.equals(newItem.searchText, oldItem.searchText)
                }
                return true;
            }
        })
    }
    
    ....
}

```

这里需要注意的是数据item必须实现MultiItemEntity接口:

```

public class ContactUIItemData implements MultiItemEntity {

    ...

    @Override
    public int getItemType() {
        return viewType;
    }
}

```

并且需要实现DiffCallback，DiffCallback有两个方法需要实现，第一个用来判断两个item是否同一类型，如果判断是，则调用第二个方法判断两个item内容是否相等，这两个方法需要根据实际业务场景谨慎实现。

* 刷新数据统一调用setDiffNewData，无论是第一次加载数据还是后续数据变更刷新，这里要注意的是，刷新时调用setDiffNewData需要传入新的数据列表才能实现刷新。

* 如只需刷新某个item，则可以通过notifyItemChanged来实现，当然添加和删除数据都有对应的方法，但是添加和删除还是统一走setDiffNewData比较好。

* 如只需刷新某个item中的某个元素，而不是刷新整个item，则可以通过payload的方式来实现局部刷新，例如:


```

override fun convert(holder: BaseViewHolder, item: GroupUIItemData, payloads: List<Any>) {
    super.convert(holder, item, payloads)
    when(holder.itemViewType) {
        GroupContactItemConstants.ITEM_TYPE_CONTACT -> {
            if (payloads.isEmpty()) {
                return
            }

            val payload = payloads[0];
            if (payload == EDIT_MODE_PAYLOAD) {

                val cbSelect = holder.getView<CheckBox>(R.id.cb_select)
                cbSelect.isChecked = item.checked
                cbSelect.isEnabled = item.enabled

                if (item.canSelect) {
                    cbSelect.visibility = View.VISIBLE
                } else {
                    cbSelect.visibility = View.GONE
                }
            }
        }
    }
}

```

对需要局部刷新的item调用contactsAdapter.notifyItemChanged(position, GroupContactAdapter.EDIT_MODE_PAYLOAD).

* 如遇到列表不刷新的问题，则需要检查调用setDiffNewData时传入的是否时新的列表，数据源对象是不是新对象，从多个方面来排查，理论上更新列表就统一使用这个方法，避免调用notifyDataSetChanged.

* 要注意DiffCallback的实现，如果遇到问题，可调试此接口两个方法实现的返回值。

* Item的点击事件响应都是通过setOnItemClickListener和setOnItemChildClickListener分别实现，前者是注册整个item，后者是注册item上的子view，子view的响应需要调用addChildClickViewIds来分别注册。

* Item的长按与点击相同，分别对应setOnItemLongClickListener和setOnItemChildLongClickListener两个方法。
